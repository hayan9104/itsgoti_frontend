import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { contactsAPI, pagesAPI } from '../services/api';
import useWindowSize from '../hooks/useWindowSize';
import EditableSection from '../components/EditableSection';

// Helper to get full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

const Contact = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [selectedSection, setSelectedSection] = useState(null);

  // Page content from CMS
  const [pageContent, setPageContent] = useState({
    // Hero Image
    heroImage: '',
    heroImageMobile: '',
    // Form Section
    formTitle: 'Tell us',
    formTitleItalic: 'more',
    // Form Labels
    nameLabel: 'Your Name',
    namePlaceholder: 'Your Name',
    emailLabel: 'Work Email',
    emailPlaceholder: 'example.svg.com',
    phoneLabel: 'Phone no.',
    phonePlaceholder: '0000000000',
    messageLabel: 'How can we help?',
    messagePlaceholder: 'Describe your project',
    sourceLabel: 'How did you get to know about us?',
    // Source Options
    sourceOptions: ['Social', 'Referral', 'Google', 'ChatGPT', 'Other'],
    // Submit Button
    submitButtonText: 'Submit',
    // Success Message
    successTitle: 'Thank you!',
    successMessage: "We've received your message and will get back to you soon.",
    successButtonText: 'Send another message',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    fetchPageContent();
  }, []);

  // Editor mode: Listen for updates from parent
  useEffect(() => {
    if (!isEditorMode) return;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'EDITOR_UPDATE') {
        if (event.data.payload?.data) {
          setPageContent(prev => ({
            ...prev,
            ...event.data.payload.data
          }));
        }
      }

      if (event.data.type === 'SECTION_SELECTED') {
        setSelectedSection(event.data.sectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  const fetchPageContent = async () => {
    try {
      const response = await pagesAPI.getOne('contact');
      if (response.data.data && response.data.data.content) {
        setPageContent((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      // Use default content if page not configured
      console.log('Using default content for contact page');
    }
  };

  const onSubmit = async (data) => {
    try {
      setError('');
      await contactsAPI.create({
        ...data,
        subject: `New Inquiry from ${data.name}`,
        source: selectedSource,
        sourcePage: 'Contact Page',
      });
      setSubmitted(true);
      reset();
      setSelectedSource('');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  // Get the appropriate image based on screen size
  const heroImagePath = isMobile
    ? (pageContent.heroImageMobile || pageContent.heroImage)
    : pageContent.heroImage;
  const heroImage = getImageUrl(heroImagePath);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', position: 'relative', overflow: 'visible' }}>
      {/* Left Image Section - extends down behind footer */}
      <EditableSection
        sectionId="hero"
        label="Hero Image"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'hero'}
      >
      {!isMobile && (
        <div
          style={{
            width: isTablet ? '45%' : '50%',
            position: 'absolute',
            left: 0,
            top: 0,
            height: 'calc(100% + 200px)',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt="Contact"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '16px',
                backgroundColor: '#f0f0f0',
              }}
            >
              Team Image
            </div>
          )}
        </div>
      )}
      </EditableSection>

      {/* Hero Section */}
      <EditableSection
        sectionId="form"
        label="Form Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'form'}
      >
      <section
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: isMobile ? 'auto' : 'auto',
          position: 'relative',
        }}
      >
        {/* Mobile Image */}
        {isMobile && (
          <div
            style={{
              width: '100%',
              height: '320px',
              marginBottom: '49px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt="Contact"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '16px',
                  backgroundColor: '#f0f0f0',
                }}
              >
                Team Image
              </div>
            )}
          </div>
        )}

        {/* Right Form Section */}
        <div
          style={{
            backgroundColor: '#fff',
            width: isMobile ? '100%' : isTablet ? '55%' : '50%',
            marginLeft: isMobile ? '0' : isTablet ? '45%' : '50%',
            padding: isMobile
              ? '0 24px 80px'
              : isTablet
                ? '40px 40px 40px'
                : '50px 70px 50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: isMobile ? '32px' : isTablet ? '40px' : '50px',
              fontWeight: 400,
              color: '#0A0A0A',
              marginBottom: isMobile ? '24px' : '32px',
              marginTop: 0,
              lineHeight: 'normal',
              letterSpacing: '-1px',
            }}
          >
            {pageContent.formTitle}{' '}
            <em
              style={{
                fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', 'Inter', sans-serif",
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '-1px',
              }}
            >
              {pageContent.formTitleItalic}
            </em>
            ..
          </h1>

          {submitted ? (
            <div
              style={{
                backgroundColor: '#E1FFA0',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '24px',
                  color: '#000',
                  marginBottom: '12px',
                }}
              >
                {pageContent.successTitle}
              </h3>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '16px',
                  color: '#333',
                  marginBottom: '24px',
                }}
              >
                {pageContent.successMessage}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '16px',
                  color: '#2558BF',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {pageContent.successButtonText}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#DC2626',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Your Name */}
              <div style={{ marginBottom: '12px', marginRight: isMobile ? '0' : '191px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '16px' : '20px',
                    fontWeight: 400,
                    color: '#000',
                    lineHeight: '24px',
                    marginBottom: '8px',
                  }}
                >
                  {pageContent.nameLabel}<span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder={pageContent.namePlaceholder}
                  {...register('name', { required: 'Name is required' })}
                  style={{
                    width: '100%',
                    padding: '15px 16px',
                    border: '1px solid #D9D9D9',
                    borderRadius: '0',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '24px',
                    color: 'rgba(0, 0, 0, 0.60)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2558BF';
                    e.target.style.color = '#000';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D9D9D9';
                    if (!e.target.value) e.target.style.color = 'rgba(0, 0, 0, 0.60)';
                  }}
                />
                {errors.name && (
                  <p
                    style={{
                      color: '#DC2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    }}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Work Email and Phone */}
              <div
                style={{
                  display: 'flex',
                  gap: isMobile ? '12px' : '16px',
                  marginBottom: '12px',
                  marginRight: isMobile ? '0' : '191px',
                  flexDirection: isMobile ? 'column' : 'row',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: 400,
                      color: '#000',
                      lineHeight: '24px',
                      marginBottom: '8px',
                    }}
                  >
                    {pageContent.emailLabel}<span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder={pageContent.emailPlaceholder}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '15px 16px',
                      border: '1px solid #D9D9D9',
                      borderRadius: '0',
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '24px',
                      color: 'rgba(0, 0, 0, 0.60)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2558BF';
                      e.target.style.color = '#000';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D9D9D9';
                      if (!e.target.value) e.target.style.color = 'rgba(0, 0, 0, 0.60)';
                    }}
                  />
                  {errors.email && (
                    <p
                      style={{
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      }}
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: 400,
                      color: '#000',
                      lineHeight: '24px',
                      marginBottom: '8px',
                    }}
                  >
                    {pageContent.phoneLabel}<span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder={pageContent.phonePlaceholder}
                    maxLength={10}
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Phone number must be exactly 10 digits',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '15px 16px',
                      border: '1px solid #D9D9D9',
                      borderRadius: '0',
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '24px',
                      color: 'rgba(0, 0, 0, 0.60)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2558BF';
                      e.target.style.color = '#000';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D9D9D9';
                      if (!e.target.value) e.target.style.color = 'rgba(0, 0, 0, 0.60)';
                    }}
                  />
                  {errors.phone && (
                    <p
                      style={{
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      }}
                    >
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* How can we help? */}
              <div style={{ marginBottom: '12px', marginRight: isMobile ? '0' : '191px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '16px' : '20px',
                    fontWeight: 400,
                    color: '#000',
                    lineHeight: '24px',
                    marginBottom: '8px',
                  }}
                >
                  {pageContent.messageLabel}<span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={pageContent.messagePlaceholder}
                  {...register('message', { required: 'Message is required' })}
                  style={{
                    width: '100%',
                    padding: '15px 21px',
                    border: '1px solid #D9D9D9',
                    borderRadius: '0',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '24px',
                    color: 'rgba(0, 0, 0, 0.60)',
                    outline: 'none',
                    resize: 'vertical',
                    height: isMobile ? '120px' : '139px',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2558BF';
                    e.target.style.color = '#000';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D9D9D9';
                    if (!e.target.value) e.target.style.color = 'rgba(0, 0, 0, 0.60)';
                  }}
                />
                {errors.message && (
                  <p
                    style={{
                      color: '#DC2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    }}
                  >
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* How did you get to know about us? */}
              <div style={{ marginBottom: isMobile ? '20px' : '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isMobile ? '16px' : '20px',
                    fontWeight: 400,
                    color: '#000',
                    lineHeight: '24px',
                    marginBottom: '12px',
                  }}
                >
                  {pageContent.sourceLabel}<span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  {pageContent.sourceOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedSource(option)}
                      style={{
                        padding: '4px 12px',
                        border: selectedSource === option ? '1px solid #000' : '1px solid rgba(0, 0, 0, 0.60)',
                        borderRadius: '200px',
                        backgroundColor: selectedSource === option ? '#000' : 'transparent',
                        color: selectedSource === option ? '#fff' : 'rgba(0, 0, 0, 0.60)',
                        fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: 400,
                        lineHeight: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : '140px',
                  padding: isMobile ? '12px 28px' : '12px 32px',
                  backgroundColor: '#2558BF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '100px',
                  fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {isSubmitting ? 'Sending...' : pageContent.submitButtonText}
              </button>
            </form>
          )}
        </div>
      </section>
      </EditableSection>
      {/* Spacer for footer overlap on desktop */}
      {!isMobile && <div style={{ height: '100px' }} />}
    </div>
  );
};

export default Contact;
