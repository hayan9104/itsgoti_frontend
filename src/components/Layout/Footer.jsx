import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useWindowSize from '../../hooks/useWindowSize';
import vectorIcon from '../../assets/Vector.png';
import { pagesAPI } from '../../services/api';

const Footer = () => {
  const { isMobile, isTablet } = useWindowSize();

  // Page content from CMS
  const [content, setContent] = useState({
    sayHelloTitle: 'SAY HELLO!',
    buttonText: 'Schedule Call',
    instantResponseText: 'Get instant response',
    businessEmailLabel: 'For Business',
    businessEmail: 'sayhello@goti.design',
    jobsEmailLabel: 'For Jobs',
    jobsEmail: 'people@goti.design',
    location1Label: 'Location',
    location1Address: '89, Lorem ipsum\nolor sit amet\nconsectetu - 4312948',
    location2Label: 'Location',
    location2Address: '89, Lorem ipsum\nolor sit amet\nconsectetu - 4312948',
    linkedinUrl: 'https://linkedin.com',
    instagramUrl: 'https://instagram.com',
    copyrightText: '©2026 GOTI.DESIGN. ALL RIGHTS RESERVED',
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await pagesAPI.getOne('footer');
        if (response.data.data && response.data.data.content) {
          setContent(prev => ({ ...prev, ...response.data.data.content }));
        }
      } catch (error) {
        // Use default content
      }
    };
    fetchContent();
  }, []);

  // Helper to render multiline text
  const renderMultiline = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  };

  // Responsive padding (top right bottom left)
  const footerPadding = isMobile ? '40px 24px 20px 24px' : isTablet ? '48px 40px 25px 40px' : '64px 100px 25px 100px';

  return (
    <footer>
      {/* Main Footer - Blue */}
      <section
        style={{
          backgroundColor: '#2558BF',
          borderTopLeftRadius: isMobile ? '160px' : isTablet ? '150px' : '293px',
          borderTopRightRadius: isMobile ? '160px' : isTablet ? '150px' : '293px',
          borderBottomLeftRadius: isMobile ? '0' : '0',
          borderBottomRightRadius: '0',
          position: 'relative',
          zIndex: 100,
          marginTop: isMobile ? '0' : isTablet ? '-80px' : '-100px',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: footerPadding }}>
          {/* Say Hello Section */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '28px' : '48px' }}>
            <h2
              style={{
                color: '#fff',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '32px' : isTablet ? '54px' : '72px',
                fontWeight: 500,
                letterSpacing: '2px',
                marginBottom: isMobile ? '20px' : '32px',
              }}
            >
              {content.sayHelloTitle}
            </h2>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #FFF',
                backgroundColor: 'transparent',
                color: '#fff',
                width: '223px',
                height: '56px',
                padding: '12px 24px',
                gap: '12px',
                borderRadius: '200px',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '20px',
                fontWeight: isMobile ? 400 : 600,
                lineHeight: '24px',
                textDecoration: 'none',
                marginBottom: '16px',
              }}
            >
              {content.buttonText}
            </Link>
            <div
              style={{
                color: '#fff',
                fontSize: isMobile ? '14px' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '11px',
                marginTop: '9px',
              }}
            >
              <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{content.instantResponseText}</span>
            </div>
          </div>

          {/* Footer Links Grid */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'row',
              justifyContent: isMobile ? 'space-between' : 'center',
              gap: isMobile ? '16px' : isTablet ? '48px' : '96px',
              marginBottom: isMobile ? '24px' : '48px',
              flexWrap: isMobile ? 'nowrap' : 'nowrap',
            }}
          >
            {/* Write to us */}
            <div style={{ width: isMobile ? 'auto' : '219px', flex: isMobile ? 1 : 'none' }}>
              <h3
                style={{
                  color: '#fff',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '16px' : '22px',
                  fontWeight: 500,
                  lineHeight: '26px',
                  letterSpacing: '0.22px',
                  marginBottom: isMobile ? '16px' : '46px',
                }}
              >
                Write to us
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
                <div>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? '12px' : '16px',
                      lineHeight: '26px',
                      letterSpacing: '0.16px',
                      marginBottom: '0',
                    }}
                  >
                    {content.businessEmailLabel}
                  </p>
                  <a
                    href={`mailto:${content.businessEmail}`}
                    style={{
                      color: '#fff',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? '14px' : '20px',
                      lineHeight: '26px',
                      letterSpacing: '0.2px',
                      textDecoration: 'none',
                    }}
                  >
                    {content.businessEmail}
                  </a>
                </div>
                <div>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? '12px' : '16px',
                      lineHeight: '26px',
                      letterSpacing: '0.16px',
                      marginBottom: '0',
                    }}
                  >
                    {content.jobsEmailLabel}
                  </p>
                  <a
                    href={`mailto:${content.jobsEmail}`}
                    style={{
                      color: '#fff',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? '14px' : '20px',
                      lineHeight: '26px',
                      letterSpacing: '0.2px',
                      textDecoration: 'none',
                    }}
                  >
                    {content.jobsEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Join us at - Desktop/Tablet only (side by side) */}
            {!isMobile && (
              <div style={{ width: '457px' }}>
                <h3
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '22px',
                    fontWeight: 500,
                    lineHeight: '26px',
                    letterSpacing: '0.22px',
                    marginBottom: '46px',
                  }}
                >
                  Join us at
                </h3>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '46px' }}>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '16px',
                        lineHeight: '26px',
                        letterSpacing: '0.16px',
                        marginBottom: '12px',
                      }}
                    >
                      {content.location1Label}
                    </p>
                    <p
                      style={{
                        color: '#fff',
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '20px',
                        lineHeight: '26px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {renderMultiline(content.location1Address)}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '16px',
                        lineHeight: '26px',
                        letterSpacing: '0.16px',
                        marginBottom: '12px',
                      }}
                    >
                      {content.location2Label}
                    </p>
                    <p
                      style={{
                        color: '#fff',
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '20px',
                        lineHeight: '26px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {renderMultiline(content.location2Address)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div style={{ width: isMobile ? 'auto' : '219px', flex: isMobile ? 1 : 'none' }}>
              <h3
                style={{
                  color: '#fff',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '16px' : '22px',
                  fontWeight: 500,
                  lineHeight: '26px',
                  letterSpacing: '0.22px',
                  marginBottom: isMobile ? '16px' : '46px',
                }}
              >
                Quick Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '18px' }}>
                <Link
                  to="/work"
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    lineHeight: '26px',
                    letterSpacing: '0.2px',
                    textDecoration: 'none',
                  }}
                >
                  Our Work
                </Link>
                <Link
                  to="/case-studies"
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    lineHeight: '26px',
                    letterSpacing: '0.2px',
                    textDecoration: 'none',
                  }}
                >
                  Case Study
                </Link>
                <Link
                  to="/approach"
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    lineHeight: '26px',
                    letterSpacing: '0.2px',
                    textDecoration: 'none',
                  }}
                >
                  Approach
                </Link>
                <Link
                  to="/about"
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    lineHeight: '26px',
                    letterSpacing: '0.2px',
                    textDecoration: 'none',
                  }}
                >
                  About Us
                </Link>
              </div>
            </div>
          </div>

          {/* Join us at - Mobile only (centered below) */}
          {isMobile && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3
                style={{
                  color: '#fff',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '26px',
                  letterSpacing: '0.22px',
                  marginBottom: '12px',
                }}
              >
                Join us at
              </h3>
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '12px',
                  lineHeight: '26px',
                  letterSpacing: '0.16px',
                  marginBottom: '4px',
                }}
              >
                {content.location1Label}
              </p>
              <p
                style={{
                  color: '#fff',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '14px',
                  lineHeight: '22px',
                  letterSpacing: '0.2px',
                  marginBottom: '24px',
                }}
              >
                {renderMultiline(content.location1Address)}
              </p>
              {/* Divider line */}
              <div
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              />
            </div>
          )}

          {/* Bottom Bar */}
          <div style={{ borderTop: isMobile ? 'none' : '1px solid rgba(255,255,255,0.2)', paddingTop: isMobile ? '0' : '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: isMobile ? 'center' : 'space-between',
                alignItems: 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '16px' : '0',
              }}
            >
              {/* Links - First on mobile */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '24px' : '55px',
                  order: isMobile ? 1 : 0,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Link
                  to="/privacy"
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '11px' : '14px',
                    lineHeight: '26px',
                    textDecoration: 'none',
                  }}
                >
                  PRIVACY POLICY
                </Link>
                <Link
                  to="/terms"
                  style={{
                    color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '11px' : '14px',
                    lineHeight: '26px',
                    textDecoration: 'none',
                  }}
                >
                  TERMS AND CONDITIONS
                </Link>
              </div>

              {/* Social Icons - Second on mobile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', order: isMobile ? 2 : 0 }}>
                <a href={content.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>

              {/* Copyright - Third on mobile */}
              <p
                style={{
                  color: '#fff',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '11px' : '14px',
                  lineHeight: '26px',
                  order: isMobile ? 3 : 0,
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {content.copyrightText}
              </p>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
