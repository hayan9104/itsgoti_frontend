import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorksManager from './WorksManager';
import CaseStudiesManager from './CaseStudiesManager';
import ContactsManager from './ContactsManager';
import PagesManager from './PagesManager';
import AccountManager from './AccountManager';
import VisualPageEditor from './pageEditor/VisualPageEditor';

// Icon components
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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', exact: true, icon: DashboardIcon },
    { to: '/admin/works', label: 'Works', icon: WorksIcon },
    { to: '/admin/case-studies', label: 'Case Studies', icon: CaseStudyIcon },
    { to: '/admin/contacts', label: 'Contacts', icon: ContactsIcon },
    { to: '/admin/pages', label: 'Pages', icon: PagesIcon },
  ];

  const bottomNavItems = [
    { to: '/admin/account', label: 'Account', icon: AccountIcon },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Admin Header */}
      <header style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/admin" style={{ fontSize: '20px', fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
            Admin Panel
          </Link>
          <Link
            to="/"
            style={{ fontSize: '14px', color: '#2563eb', textDecoration: 'none' }}
            target="_blank"
          >
            View Site
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#4b5563' }}>Welcome, {user?.name}</span>
          <button
            onClick={handleLogout}
            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{
          width: '220px',
          backgroundColor: '#fff',
          boxShadow: '1px 0 3px rgba(0,0,0,0.05)',
          minHeight: 'calc(100vh - 65px)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    marginBottom: '4px',
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

          {/* Bottom Navigation - Account */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    marginBottom: '4px',
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
            <Route path="/" element={<DashboardHome />} />
            <Route path="/works/*" element={<WorksManager />} />
            <Route path="/case-studies/*" element={<CaseStudiesManager />} />
            <Route path="/contacts/*" element={<ContactsManager />} />
            <Route path="/pages/:pageName/edit" element={<VisualPageEditor />} />
            <Route path="/pages/*" element={<PagesManager />} />
            <Route path="/account" element={<AccountManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Works</h3>
          <p style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>-</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Case Studies</h3>
          <p style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>-</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Contacts</h3>
          <p style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>-</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Pages</h3>
          <p style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>6</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
