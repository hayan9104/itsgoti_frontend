import { useState, useEffect, useRef, createContext, useContext } from 'react';

const API_BASE = '/api';

// Context for managing booking modal state globally
const BookingModalContext = createContext();

export const useBookingModal = () => {
  const context = useContext(BookingModalContext);
  if (!context) {
    throw new Error('useBookingModal must be used within BookingModalProvider');
  }
  return context;
};

export const BookingModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openBookingModal = () => setIsOpen(true);
  const closeBookingModal = () => setIsOpen(false);

  return (
    <BookingModalContext.Provider value={{ isOpen, openBookingModal, closeBookingModal }}>
      {children}
      {isOpen && <BookingModal onClose={closeBookingModal} />}
    </BookingModalContext.Provider>
  );
};

const BookingModal = ({ isOpen: propIsOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dateScrollIndex, setDateScrollIndex] = useState(0);
  const slotsContainerRef = useRef(null);
  const modalOverlayRef = useRef(null);

  // Responsive detection
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    brandDetails: '',
    challenge: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receiveOnPhone, setReceiveOnPhone] = useState(true);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    const scrollY = window.scrollY;

    // Lock body completely
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Default styling
  const styles = {
    primaryColor: settings?.primaryColor || '#000000',
    accentColor: settings?.accentColor || '#f59e0b',
    headingColor: settings?.headingColor || '#111111',
    textColor: settings?.textColor || '#333333',
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchInitialData = async () => {
    try {
      const cached = sessionStorage.getItem('bookingData');
      if (cached) {
        const { dates, settings: cachedSettings, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setAvailableDates(dates);
          setSettings(cachedSettings || {});
          if (dates.length > 0) {
            setSelectedDate(dates[0].date);
          }
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE}/bookings/available-dates`);
      const data = await res.json();
      if (data.success) {
        setAvailableDates(data.data);
        setSettings(data.settings || {});
        if (data.data.length > 0) {
          setSelectedDate(data.data[0].date);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const fetchAvailableSlots = async (date) => {
    setSlotsLoading(true);
    setAvailableSlots([]);
    try {
      const res = await fetch(`${API_BASE}/bookings/slots/${date}`);
      const data = await res.json();
      if (data.success) {
        setAvailableSlots(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedSlot(data.data[0]);
        } else {
          setSelectedSlot(null);
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
    setSlotsLoading(false);
  };

  const formatDateCard = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  const formatDateLong = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return formatTime(`${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.brandDetails.trim()) newErrors.brandDetails = 'This field is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
          timeSlot: selectedSlot,
          source: 'Booking Modal',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'booking_submission', {
            event_category: 'Booking',
            event_label: 'Booking Modal',
            value: 1
          });
        }
      } else {
        alert(data.message || 'Error booking. Please try again.');
      }
    } catch (error) {
      alert('Error submitting booking. Please try again.');
    }
    setSubmitting(false);
  };

  const scrollDates = (direction) => {
    const maxScroll = Math.max(0, availableDates.length - (isMobile ? 4 : 5));
    if (direction === 'left') {
      setDateScrollIndex(Math.max(0, dateScrollIndex - 1));
    } else {
      setDateScrollIndex(Math.min(maxScroll, dateScrollIndex + 1));
    }
  };

  const descriptionBullets = settings?.descriptionBullets?.length > 0
    ? settings.descriptionBullets
    : [
        'Ask questions to understand your vision & challenges',
        'Break any myths that might be holding you back',
        'Walk you through our Industry leading process',
        'See if this is a good fit, if yes then take it forward!',
      ];


  // Calculate modal dimensions based on screen size
  const getModalSize = () => {
    if (isMobile) {
      return {
        width: '95%',
        maxWidth: '100%',
        maxHeight: '92vh',
      };
    }
    if (isTablet) {
      return {
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
      };
    }
    // Desktop
    return {
      width: '95%',
      maxWidth: step === 1 ? '1000px' : '580px',
      maxHeight: '90vh',
    };
  };

  const modalSize = getModalSize();

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 16, color: '#666' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (submitted) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isMobile ? 16 : 20,
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          padding: isMobile ? 32 : 48,
          maxWidth: 450,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out'
        }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, marginBottom: 10, color: styles.headingColor }}>
            Booking Submitted!
          </h2>
          <p style={{ color: styles.textColor, marginBottom: 28, lineHeight: 1.6, fontSize: isMobile ? 14 : 15 }}>
            Your booking request has been submitted. We'll review and send you a confirmation email shortly.
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 14,
            padding: isMobile ? 18 : 22,
            textAlign: 'left',
            marginBottom: 28
          }}>
            <div style={{ marginBottom: 10, fontSize: isMobile ? 14 : 15 }}>
              <strong>Date:</strong> {formatDateLong(selectedDate)}
            </div>
            <div style={{ marginBottom: 10, fontSize: isMobile ? 14 : 15 }}>
              <strong>Time:</strong> {formatTime(selectedSlot)} IST
            </div>
            <div style={{ fontSize: isMobile ? 14 : 15 }}>
              <strong>Duration:</strong> {settings?.slotDuration || 30} minutes
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: isMobile ? '14px 32px' : '15px 40px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: styles.primaryColor,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            Close
          </button>
        </div>
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: scale(0.95) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      ref={modalOverlayRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isMobile ? 10 : 20,
      }}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: isMobile ? 20 : 24,
          width: modalSize.width,
          maxWidth: modalSize.maxWidth,
          height: 'auto',
          maxHeight: modalSize.maxHeight,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? 12 : 16,
            right: isMobile ? 12 : 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.95)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Step 1: Date & Time Selection */}
        {step === 1 && (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            flex: 1,
            minHeight: 0,
          }}>
            {/* Left Panel - Info */}
            <div
              onWheel={(e) => e.stopPropagation()}
              style={{
                flex: isMobile ? 'none' : '1 1 45%',
                minHeight: isMobile ? 'auto' : 0,
                padding: isMobile ? '24px 20px 20px' : '32px',
                borderRight: isMobile ? 'none' : '1px solid #f0f0f0',
                borderBottom: isMobile ? '1px solid #f0f0f0' : 'none',
                overflowY: 'scroll',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}>
              {/* Rating */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: 20,
                marginBottom: 16,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{settings?.hostRating || 5}</span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: isMobile ? 22 : 26,
                fontWeight: 700,
                color: styles.headingColor,
                lineHeight: 1.3,
                marginBottom: 16,
                margin: 0,
                marginTop: 8,
                paddingRight: 40,
              }}>
                {settings?.meetingTitle || "Book a Direct Call with Our Founder's Team"}
              </h2>

              {/* Duration */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingBottom: 16,
                marginBottom: 16,
                marginTop: 16,
                borderBottom: '1px solid #e5e5e5'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span style={{ fontSize: 14, color: styles.textColor }}>{settings?.slotDuration || 30} mins</span>
              </div>

              {/* Description - Hidden on mobile to save space */}
              {!isMobile && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: styles.headingColor, marginBottom: 12 }}>
                    Here is how we will help you:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {descriptionBullets.slice(0, 3).map((bullet, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{
                          width: 22,
                          height: 22,
                          minWidth: 22,
                          borderRadius: '50%',
                          backgroundColor: styles.accentColor,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}>{i + 1}</span>
                        <span style={{ color: styles.textColor, fontSize: 13, lineHeight: 1.5 }}>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Date & Time */}
            <div
              onWheel={(e) => e.stopPropagation()}
              style={{
                flex: isMobile ? 1 : '1 1 55%',
                minHeight: 0,
                padding: isMobile ? '20px' : '32px',
                overflowY: 'scroll',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
              }}>
              <h3 style={{
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
                color: styles.headingColor,
                marginBottom: 16
              }}>
                When should we meet?
              </h3>

              {/* Date Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24
              }}>
                <button
                  onClick={() => scrollDates('left')}
                  disabled={dateScrollIndex === 0}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid #e5e5e5',
                    backgroundColor: '#fff',
                    cursor: dateScrollIndex === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: dateScrollIndex === 0 ? 0.4 : 1,
                    flexShrink: 0
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    transform: `translateX(-${dateScrollIndex * (isMobile ? 70 : 80)}px)`,
                    transition: 'transform 0.3s ease-out'
                  }}>
                    {availableDates.map((item) => {
                      const d = formatDateCard(item.date);
                      const isSelected = selectedDate === item.date;
                      return (
                        <button
                          key={item.date}
                          onClick={() => {
                            setSelectedDate(item.date);
                            setSelectedSlot(null);
                          }}
                          style={{
                            padding: isMobile ? '10px 12px' : '12px 14px',
                            borderRadius: 12,
                            border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                            backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            minWidth: isMobile ? 62 : 68,
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ fontSize: 11, color: isSelected ? styles.accentColor : '#666', fontWeight: 500 }}>{d.day}</div>
                          <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: isSelected ? styles.accentColor : styles.headingColor }}>{d.date} {d.month}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => scrollDates('right')}
                  disabled={dateScrollIndex >= availableDates.length - (isMobile ? 4 : 5)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid #e5e5e5',
                    backgroundColor: '#fff',
                    cursor: dateScrollIndex >= availableDates.length - (isMobile ? 4 : 5) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: dateScrollIndex >= availableDates.length - (isMobile ? 4 : 5) ? 0.4 : 1,
                    flexShrink: 0
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Time Slots */}
              <h4 style={{ fontSize: 14, fontWeight: 600, color: styles.headingColor, marginBottom: 12 }}>
                Select time of day
              </h4>

              <div ref={slotsContainerRef} onWheel={(e) => e.stopPropagation()} style={{ flex: 1, overflowY: 'scroll', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', marginBottom: 20, minHeight: isMobile ? 150 : 180, maxHeight: isMobile ? 200 : 220 }}>
                {slotsLoading ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>Loading slots...</div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>No slots available</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 8 }}>
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: isMobile ? '12px 6px' : '12px 8px',
                            borderRadius: 10,
                            border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                            backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                            cursor: 'pointer',
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: 500,
                            color: isSelected ? styles.accentColor : styles.textColor
                          }}
                        >
                          {formatTime(slot)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Timezone */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: styles.headingColor, marginBottom: 8, display: 'block' }}>Timezone</label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e5e5e5',
                    fontSize: 13,
                    color: styles.textColor,
                    backgroundColor: '#fff'
                  }}
                  defaultValue="Asia/Kolkata"
                >
                  <option value="Asia/Kolkata">(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                </select>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedSlot}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px' : '16px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: selectedDate && selectedSlot ? styles.primaryColor : '#ccc',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
                  marginTop: 'auto'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Header */}
            <div style={{
              padding: isMobile ? '16px 20px' : '20px 28px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexShrink: 0,
            }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.headingColor} strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>G</span>
                )}
              </div>
              <span style={{ fontWeight: 500, color: styles.headingColor, fontSize: 15 }}>
                {settings?.hostName || 'Ved Patel'}
              </span>
            </div>

            {/* Scrollable Content */}
            <div onWheel={(e) => e.stopPropagation()} style={{ flex: 1, minHeight: 0, overflowY: 'scroll', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: isMobile ? '20px' : '28px' }}>
              {/* Title */}
              <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: styles.headingColor, marginBottom: 6 }}>
                {settings?.meetingTitle || "Book A Direct Call"}
              </h2>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
                {settings?.callType || 'Video Call'} | {settings?.slotDuration || 30}mins
              </p>

              {/* Selected Date/Time */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '12px' : '14px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e5e5',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>{formatDateCard(selectedDate).month}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: styles.headingColor }}>{formatDateCard(selectedDate).date}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: styles.headingColor, fontSize: 13 }}>{formatDateLong(selectedDate)}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{formatTime(selectedSlot)} - {getEndTime(selectedSlot, settings?.slotDuration || 30)}</div>
                  </div>
                </div>
                <button onClick={() => setStep(1)} style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e5e5',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 12
                }}>Change</button>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.headingColor, fontSize: 14 }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: errors.name ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.name}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.headingColor, fontSize: 14 }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: errors.email ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.email && <span style={{ color: '#ef4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.email}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.headingColor, fontSize: 14 }}>
                    Company name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="N/A if not decided"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: errors.companyName ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.companyName && <span style={{ color: '#ef4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.companyName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.headingColor, fontSize: 14 }}>
                    About your brand & products
                  </label>
                  <input
                    type="text"
                    value={formData.brandDetails}
                    onChange={(e) => setFormData({ ...formData, brandDetails: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: errors.brandDetails ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.brandDetails && <span style={{ color: '#ef4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.brandDetails}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.headingColor, fontSize: 14 }}>Phone number</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '14px 12px',
                      borderRadius: 10,
                      border: '1px solid #e5e5e5',
                      backgroundColor: '#f9fafb'
                    }}>
                      <span style={{ fontSize: 16 }}>🇮🇳</span>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: errors.phone ? '1px solid #ef4444' : '1px solid #e5e5e5',
                        fontSize: 15,
                        outline: 'none'
                      }}
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <span style={{ color: '#ef4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.phone}</span>}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={receiveOnPhone}
                    onChange={(e) => setReceiveOnPhone(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: 13, color: styles.textColor }}>Receive booking details on phone</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: isMobile ? '16px 20px' : '18px 28px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              backgroundColor: '#fafafa',
              flexShrink: 0,
            }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: isMobile ? '14px 28px' : '15px 36px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: styles.primaryColor,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BookingModal;
