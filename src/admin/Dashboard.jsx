import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorksManager from './WorksManager';
import CaseStudiesManager from './CaseStudiesManager';
import ContactsManager from './ContactsManager';
import PagesManager from './PagesManager';
import VisualPageEditor from './pageEditor/VisualPageEditor';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/works', label: 'Works' },
    { to: '/admin/case-studies', label: 'Case Studies' },
    { to: '/admin/contacts', label: 'Contacts' },
    { to: '/admin/pages', label: 'Pages' },
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
        <aside style={{ width: '220px', backgroundColor: '#fff', boxShadow: '1px 0 3px rgba(0,0,0,0.05)', minHeight: 'calc(100vh - 65px)', padding: '16px' }}>
          <nav>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#374151',
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
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
