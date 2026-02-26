import { Link, NavLink } from 'react-router-dom';
import rightArrow from '../../assets/right arrow.png';
import rightArrowWhite from '../../assets/right arrow.png'; // Use white version if available
import threeDots from '../../assets/three dots.png';
import useWindowSize from '../../hooks/useWindowSize';
import usePageVisibility from '../../hooks/usePageVisibility';

const Navbar = ({ dark = false, blue = false }) => {
  const { isMobile, isTablet } = useWindowSize();
  const { isPageVisible } = usePageVisibility();

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

          {/* Mobile - Empty spacer to push right content */}
          {isMobile && <div></div>}

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

    </header>
  );
};

export default Navbar;
