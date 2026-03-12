import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import rightArrow from '../../assets/right arrow.png';
import rightArrowWhite from '../../assets/right arrow.png'; // Use white version if available
import threeDots from '../../assets/three dots.png';
import useWindowSize from '../../hooks/useWindowSize';
import usePageVisibility from '../../hooks/usePageVisibility';

const Navbar = ({ dark = false, blue = false }) => {
  const { isMobile, isTablet } = useWindowSize();
  const { isPageVisible } = usePageVisibility();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Define nav links with their corresponding page names
  const allNavLinks = [
    { to: '/work', label: 'Projects', pageName: 'work' },
    { to: '/case-studies', label: 'Case Study', pageName: 'case-study' },
    { to: '/about', label: 'About', pageName: 'about' },
    { to: '/approach', label: 'Industries', pageName: 'approach' },
  ];

  // Filter out hidden pages
  const navLinks = allNavLinks.filter(link => isPageVisible(link.pageName));

  // Responsive padding
  const navPadding = isMobile ? '0 16px' : isTablet ? '0 40px' : '0 100px';
  const navHeight = isMobile ? '64px' : '80px';

  // Colors based on mode (blue takes precedence, then dark)
  const bgColor = blue ? '#2558BF' : dark ? '#0F0F0F' : '#fff';
  const textColor = (blue || dark) ? '#fff' : '#333';
  const borderColor = (blue || dark) ? '#fff' : '#000';
  const invertIcons = blue || dark;

  return (
    <header style={{ backgroundColor: bgColor, position: 'sticky', top: 0, zIndex: 9999 }}>
      <nav style={{ padding: navPadding }}>
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: navHeight,
          }}
        >
          {/* Left - Navigation Links (Desktop/Tablet only) */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? '24px' : '40px' }}>
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  style={{
                    color: textColor,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isTablet ? '16px' : '18px',
                    fontWeight: 400,
                    lineHeight: '24px',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Mobile - Hamburger Menu Button on Left */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
              aria-label="Open menu"
            >
              <span style={{ width: '22px', height: '2px', backgroundColor: textColor, borderRadius: '2px' }} />
              <span style={{ width: '22px', height: '2px', backgroundColor: textColor, borderRadius: '2px' }} />
              <span style={{ width: '22px', height: '2px', backgroundColor: textColor, borderRadius: '2px' }} />
            </button>
          )}

          {/* Right - CTA Button and Menu Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
            {/* Get in Touch Button - only show if contact page is visible */}
            {isPageVisible('contact') && (
              <Link
                to="/contact"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '100px',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    color: textColor,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px',
                    fontWeight: 400,
                    lineHeight: '24px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Get in Touch
                </span>
                <img
                  src={rightArrow}
                  alt=""
                  style={{
                    width: isMobile ? '14px' : '16px',
                    height: isMobile ? '14px' : '16px',
                    filter: invertIcons ? 'invert(1)' : 'none',
                  }}
                />
              </Link>
            )}

            {/* Three Dots Menu Icon - always visible */}
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              <img
                src={threeDots}
                alt="menu"
                style={{
                  width: isMobile ? '20px' : '24px',
                  height: 'auto',
                  filter: invertIcons ? 'invert(1)' : 'none',
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: sidebarOpen ? 0 : '-280px',
            width: '280px',
            height: '100vh',
            backgroundColor: '#fff',
            zIndex: 10001,
            transition: 'left 0.3s ease',
            boxShadow: sidebarOpen ? '4px 0 20px rgba(0, 0, 0, 0.15)' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #eee',
            }}
          >
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                color: '#2558BF',
                textDecoration: 'none',
              }}
            >
              It's Goti
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                fontSize: '24px',
                color: '#333',
                lineHeight: 1,
              }}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          {/* Sidebar Navigation Links */}
          <nav style={{ flex: 1, padding: '24px 0' }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '16px 24px',
                  color: isActive ? '#2558BF' : '#333',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '18px',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#f5f8ff' : 'transparent',
                  borderLeft: isActive ? '3px solid #2558BF' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer - Contact Button */}
          {isPageVisible('contact') && (
            <div style={{ padding: '24px', borderTop: '1px solid #eee' }}>
              <Link
                to="/contact"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  backgroundColor: '#2558BF',
                  color: '#fff',
                  borderRadius: '100px',
                  textDecoration: 'none',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                Get in Touch
                <img
                  src={rightArrow}
                  alt=""
                  style={{
                    width: '16px',
                    height: '16px',
                    filter: 'invert(1)',
                  }}
                />
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
