import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { caseStudiesAPI } from '../services/api';
import useWindowSize from '../hooks/useWindowSize';

const CaseStudies = () => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useWindowSize();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      const response = await caseStudiesAPI.getAll({ published: true });
      const studies = response.data.data;

      // If there are case studies, redirect to the first one (sorted by order)
      if (studies && studies.length > 0) {
        // Studies are already sorted by order from API, so first one has lowest order
        const firstStudy = studies[0];
        navigate(`/case-studies/${firstStudy.slug}`, { replace: true });
        return;
      }

      setCaseStudies(studies);
    } catch (error) {
      console.error('Error fetching case studies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Responsive padding
  const sectionPadding = isMobile ? '24px 16px' : isTablet ? '32px 40px' : '40px 100px';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Hero Section */}
      <section style={{ width: '100%', padding: sectionPadding }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          {/* Title */}
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '32px' : isTablet ? '40px' : '50px',
              fontWeight: 400,
              color: '#0A0A0A',
              letterSpacing: '-1px',
              lineHeight: 'normal',
              marginBottom: isMobile ? '12px' : '16px',
            }}
          >
            <span style={{ fontFamily: "'Plus Jakarta Sans-SemiBoldItalic'", fontStyle: 'italic' }}>Case</span>{' '}
            Studies
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
              fontWeight: 400,
              color: '#000',
              lineHeight: isMobile ? '26px' : '32px',
              maxWidth: isMobile ? '100%' : '600px',
              marginBottom: isMobile ? '40px' : '60px',
            }}
          >
            Explore our detailed case studies showcasing successful projects and client collaborations.
          </p>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section style={{ width: '100%', padding: sectionPadding, paddingTop: 0 }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          {caseStudies.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No case studies available yet.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
                gap: isMobile ? '24px' : '32px',
              }}
            >
              {caseStudies.map((study) => (
                <Link
                  key={study._id}
                  to={`/case-studies/${study.slug}`}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f5',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: '100%',
                      height: isMobile ? '200px' : '300px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={isMobile ? (study.heroImageMobile || study.heroImage) : study.heroImage}
                      alt={study.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ padding: isMobile ? '16px' : '24px' }}>
                    <h3
                      style={{
                        fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                        fontSize: isMobile ? '20px' : '24px',
                        fontWeight: 600,
                        color: '#000',
                        marginBottom: '8px',
                      }}
                    >
                      {study.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                        fontSize: isMobile ? '14px' : '16px',
                        color: '#666',
                        marginBottom: '12px',
                      }}
                    >
                      {study.client}
                    </p>
                    {study.industry && (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: '#2558BF',
                          color: '#fff',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {study.industry}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CaseStudies;
