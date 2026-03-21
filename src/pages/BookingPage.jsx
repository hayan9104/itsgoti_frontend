import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

const BookingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dateScrollIndex, setDateScrollIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(null);
  const slotsContainerRef = useRef(null);
  const dateScrollRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

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
  const [showSummary, setShowSummary] = useState(true);
  const [receiveOnPhone, setReceiveOnPhone] = useState(true);
  const [pageAnimated, setPageAnimated] = useState(false);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Page zoom-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setPageAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Default styling
  const defaultStyles = {
    pageBackgroundColor: '#1e3a3a',
    primaryColor: '#000000',
    accentColor: '#f59e0b',
    cardBackgroundColor: '#ffffff',
    headingColor: '#111111',
    textColor: '#333333',
  };

  const styles = {
    pageBackgroundColor: settings?.pageBackgroundColor || defaultStyles.pageBackgroundColor,
    primaryColor: settings?.primaryColor || defaultStyles.primaryColor,
    accentColor: settings?.accentColor || defaultStyles.accentColor,
    cardBackgroundColor: settings?.cardBackgroundColor || defaultStyles.cardBackgroundColor,
    headingColor: settings?.headingColor || defaultStyles.headingColor,
    textColor: settings?.textColor || defaultStyles.textColor,
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
      // Check for cached data first (pre-fetched from landing page)
      const cached = sessionStorage.getItem('bookingData');
      if (cached) {
        const { dates, settings: cachedSettings, timestamp } = JSON.parse(cached);
        // Use cache if less than 5 minutes old
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

      // Fetch fresh data if no cache or expired
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
          source: 'Booking Page',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        // Send GA event for successful booking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'booking_submission', {
            event_category: 'Booking',
            event_label: 'Booking Page',
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
    const maxScroll = Math.max(0, availableDates.length - 5);
    setSlideDirection(direction);
    if (direction === 'left') {
      setDateScrollIndex(Math.max(0, dateScrollIndex - 1));
    } else {
      setDateScrollIndex(Math.min(maxScroll, dateScrollIndex + 1));
    }
    // Reset animation after it completes
    setTimeout(() => setSlideDirection(null), 300);
  };

  const visibleDates = availableDates.slice(dateScrollIndex, dateScrollIndex + 5);

  const descriptionBullets = settings?.descriptionBullets?.length > 0
    ? settings.descriptionBullets
    : [
        'Ask questions to understand your vision & challenges',
        'Break any myths that might be holding you back',
        'Walk you through our Industry leading process',
        'See if this is a good fit, if yes then take it forward!',
      ];

  const priceDisplay = settings?.priceAmount === 0 || !settings?.priceAmount
    ? 'FREE'
    : `${settings?.currency || '₹'}${settings?.priceAmount}`;

  const nextAvailableSlot = availableDates.length > 0 && availableSlots.length > 0
    ? `${formatTime(availableSlots[0])}, ${formatDateLong(availableDates[0].date)}`
    : 'Loading...';

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: styles.pageBackgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  // Success Screen
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: styles.pageBackgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{
          backgroundColor: styles.cardBackgroundColor,
          borderRadius: 24,
          padding: isMobile ? 32 : 48,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, marginBottom: 12, color: styles.headingColor }}>
            Booking Submitted!
          </h2>
          <p style={{ color: styles.textColor, marginBottom: 32, lineHeight: 1.6, fontSize: isMobile ? 14 : 16 }}>
            Your booking request has been submitted. We'll review and send you a confirmation email with the meeting link shortly.
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 16,
            padding: isMobile ? 20 : 24,
            textAlign: 'left',
            marginBottom: 32
          }}>
            <div style={{ marginBottom: 12, fontSize: isMobile ? 14 : 15 }}>
              <strong>Date:</strong> {formatDateLong(selectedDate)}
            </div>
            <div style={{ marginBottom: 12, fontSize: isMobile ? 14 : 15 }}>
              <strong>Time:</strong> {formatTime(selectedSlot)} IST
            </div>
            <div style={{ fontSize: isMobile ? 14 : 15 }}>
              <strong>Duration:</strong> {settings?.slotDuration || 30} minutes
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: isMobile ? '14px 36px' : '16px 48px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: styles.primaryColor,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ==================== MOBILE LAYOUT ====================
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: styles.pageBackgroundColor,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Step 1: Mobile Info + Date Selection */}
        {step === 1 && (
          <>
            {/* Main Content Card */}
            <div style={{
              flex: 1,
              backgroundColor: styles.cardBackgroundColor,
              borderRadius: '0 0 24px 24px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              transform: pageAnimated ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(30px)',
              opacity: pageAnimated ? 1 : 0,
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.headingColor} strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 500, color: styles.headingColor }}>{settings?.hostName || 'Ved Patel'}</span>
                </div>
                <div style={{
                  width: 44,
                  height: 44,
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
                    <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>G</span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: 20,
                marginBottom: 16,
                alignSelf: 'flex-start'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{settings?.hostRating || 5}</span>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 24,
                fontWeight: 700,
                color: styles.headingColor,
                lineHeight: 1.3,
                marginBottom: 16,
                margin: 0
              }}>
                {settings?.meetingTitle || "Book a Direct Call with Our Founder's Team"}
              </h1>

              {/* Price & Duration */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: '1px solid #e5e5e5'
              }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: styles.headingColor,
                  padding: '8px 16px',
                  backgroundColor: '#fef3c7',
                  borderRadius: 8
                }}>{priceDisplay}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span style={{ fontSize: 14, color: styles.textColor }}>{settings?.slotDuration || 30} mins</span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: styles.headingColor, marginBottom: 12 }}>
                  Here is how we will help you:
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {descriptionBullets.map((bullet, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        minWidth: 24,
                        borderRadius: '50%',
                        backgroundColor: styles.accentColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 600
                      }}>{i + 1}</span>
                      <span style={{ color: styles.textColor, fontSize: 14, lineHeight: 1.5 }}>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Your Session Section */}
              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e5e5e5' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: styles.headingColor, marginBottom: 16 }}>
                  Book your session
                </h3>

                {/* Horizontal Date Scroll */}
                <div
                  ref={dateScrollRef}
                  style={{
                    display: 'flex',
                    gap: 10,
                    overflowX: 'auto',
                    paddingBottom: 12,
                    marginBottom: 16,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {availableDates.slice(0, 7).map((item) => {
                    const d = formatDateCard(item.date);
                    const isSelected = selectedDate === item.date;
                    return (
                      <button
                        key={item.date}
                        onClick={() => {
                          setSelectedDate(item.date);
                          setShowBottomSheet(true);
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                          backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          minWidth: 70,
                          flexShrink: 0
                        }}
                      >
                        <div style={{ fontSize: 12, color: isSelected ? styles.accentColor : '#666', fontWeight: 500 }}>{d.day}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? styles.accentColor : styles.headingColor }}>{d.date} {d.month}</div>
                      </button>
                    );
                  })}
                  {/* Calendar icon button */}
                  <button
                    onClick={() => setShowBottomSheet(true)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid #e5e5e5',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      minWidth: 50,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                </div>

                {/* Next Available + Continue */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 12
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                      {selectedSlot ? 'Selected' : 'Next available'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: styles.headingColor }}>
                      {selectedSlot
                        ? `${formatTime(selectedSlot)}, ${formatDateLong(selectedDate)}`
                        : selectedDate
                          ? formatDateLong(selectedDate)
                          : 'Select a date'
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedSlot) {
                        setStep(2);
                      } else {
                        setShowBottomSheet(true);
                      }
                    }}
                    disabled={!selectedDate}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: selectedDate ? styles.primaryColor : '#ccc',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: selectedDate ? 'pointer' : 'not-allowed',
                      opacity: selectedDate ? 1 : 0.6
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Sheet Modal */}
            {showBottomSheet && (
              <>
                {/* Overlay */}
                <div
                  onClick={() => setShowBottomSheet(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 100
                  }}
                />
                {/* Sheet */}
                <div style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: '24px 24px 0 0',
                  padding: '24px 20px',
                  paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
                  zIndex: 101,
                  maxHeight: '85vh',
                  overflow: 'auto',
                  animation: 'slideUp 0.3s ease-out'
                }}>
                  {/* Handle */}
                  <div style={{ width: 40, height: 4, backgroundColor: '#e5e5e5', borderRadius: 2, margin: '0 auto 16px' }} />

                  {/* Header with Title and Close */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: styles.headingColor, margin: 0 }}>
                      When should we meet?
                    </h3>
                    <button
                      onClick={() => setShowBottomSheet(false)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid #e5e5e5',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Date Selector */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 16,
                    marginBottom: 24,
                    scrollbarWidth: 'none'
                  }}>
                    {availableDates.map((item) => {
                      const d = formatDateCard(item.date);
                      const isSelected = selectedDate === item.date;
                      return (
                        <button
                          key={item.date}
                          onClick={() => setSelectedDate(item.date)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                            backgroundColor: isSelected ? styles.accentColor : '#fff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            minWidth: 65,
                            flexShrink: 0
                          }}
                        >
                          <div style={{ fontSize: 11, color: isSelected ? '#fff' : '#666', fontWeight: 500 }}>{d.day}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : styles.headingColor }}>{d.date} {d.month}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: styles.headingColor, marginBottom: 12 }}>
                    Select time of day
                  </h4>
                  {slotsLoading ? (
                    <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>Loading slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>No slots available</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '14px 8px',
                              borderRadius: 10,
                              border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                              backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                              cursor: 'pointer',
                              fontSize: 13,
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
                      <option value="Asia/Kolkata">(GMT+5:30) Chennai, Kolkata, Mumbai, New...</option>
                    </select>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => {
                      if (selectedSlot) {
                        setShowBottomSheet(false);
                        setStep(2);
                      }
                    }}
                    disabled={!selectedSlot}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: selectedSlot ? styles.primaryColor : '#ccc',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: selectedSlot ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: Mobile Form */}
        {step === 2 && (
          <div style={{
            flex: 1,
            backgroundColor: styles.cardBackgroundColor,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.headingColor} strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <div style={{
                  width: 36,
                  height: 36,
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
                <span style={{ fontSize: 14, fontWeight: 500, color: styles.headingColor }}>{settings?.hostName || 'Ved Patel'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span style={{ fontWeight: 600, fontSize: 12 }}>{settings?.hostRating || 5}/5</span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {/* Title */}
              <h2 style={{ fontSize: 20, fontWeight: 700, color: styles.headingColor, marginBottom: 6, lineHeight: 1.3 }}>
                {settings?.meetingTitle || "Book A Direct Call With Our Founder's Team"}
              </h2>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
                {settings?.callType || 'Video Call'} | {settings?.slotDuration || 30}mins
              </p>

              {/* Selected Date/Time */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                marginBottom: 20
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
                    <div style={{ fontSize: 18, fontWeight: 700, color: styles.headingColor }}>{formatDateCard(selectedDate).date}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: styles.headingColor, fontSize: 13 }}>{formatDateLong(selectedDate)}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{formatTime(selectedSlot)} - {getEndTime(selectedSlot, settings?.slotDuration || 30)} (GMT +05:30)</div>
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
                    Name of the company (write N/A if the name is not decided yet)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                    Tell us more about your brand & products
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
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.headingColor, fontSize: 14 }}>
                    What is your biggest challenge around your brand?
                  </label>
                  <input
                    type="text"
                    value={formData.challenge}
                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
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

            {/* Fixed Footer */}
            <div style={{
              padding: '16px 20px',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff'
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: styles.headingColor }}>{priceDisplay}</div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '14px 32px',
                  borderRadius: 10,
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

        {/* CSS Animation */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ==================== DESKTOP LAYOUT ====================
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: styles.pageBackgroundColor,
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      {/* Step 1: Select Date & Time */}
      {step === 1 && (
        <div style={{
          maxWidth: 1140,
          margin: '0 auto',
          display: 'flex',
          gap: 0,
          flexWrap: 'wrap',
          transform: pageAnimated ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(30px)',
          opacity: pageAnimated ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out'
        }}>
          {/* Left Panel - Info */}
          <div style={{
            flex: '1 1 500px',
            backgroundColor: styles.cardBackgroundColor,
            borderRadius: '24px 0 0 24px',
            padding: '32px 40px',
            minHeight: 600
          }}>
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 28,
                padding: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.headingColor} strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 500, color: styles.headingColor }}>
                {settings?.hostName || 'Ved Patel'}
              </span>
            </button>

            {/* Rating Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              backgroundColor: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: 24,
              marginBottom: 24,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontWeight: 600, fontSize: 14, color: styles.headingColor }}>
                {settings?.hostRating || 5}
              </span>
            </div>

            {/* Title & Logo Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 32
            }}>
              <h1 style={{
                fontSize: 32,
                fontWeight: 700,
                color: styles.headingColor,
                lineHeight: 1.25,
                maxWidth: 380,
                margin: 0
              }}>
                {settings?.meetingTitle || "Book a Direct Call with Our Founder's Team"}
              </h1>
              <div style={{
                width: 90,
                height: 90,
                borderRadius: 20,
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>G</span>
                )}
              </div>
            </div>

            {/* Price & Duration */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              paddingBottom: 28,
              marginBottom: 28,
              borderBottom: '1px solid #e5e5e5'
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: styles.headingColor }}>
                {priceDisplay}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span style={{ fontSize: 17, color: styles.textColor }}>
                  {settings?.slotDuration || 30} mins
                </span>
              </div>
            </div>

            {/* Description Bullets */}
            <div>
              <h3 style={{
                fontSize: 17,
                fontWeight: 600,
                color: styles.headingColor,
                marginBottom: 20
              }}>
                Here is how we will help you:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {descriptionBullets.map((bullet, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{
                      width: 26,
                      height: 26,
                      minWidth: 26,
                      borderRadius: '50%',
                      backgroundColor: styles.accentColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600
                    }}>{i + 1}</span>
                    <span style={{ color: styles.textColor, fontSize: 15, lineHeight: 1.6 }}>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Date & Time Picker */}
          <div style={{
            flex: '1 1 500px',
            backgroundColor: styles.cardBackgroundColor,
            borderRadius: '0 24px 24px 0',
            padding: '32px 40px',
            borderLeft: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 600,
              color: styles.headingColor,
              marginBottom: 24
            }}>
              When should we meet?
            </h2>

            {/* Date Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 32
            }}>
              <button
                onClick={() => scrollDates('left')}
                disabled={dateScrollIndex === 0}
                style={{
                  width: 40,
                  height: 40,
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div style={{
                flex: 1,
                overflow: 'hidden',
                maxWidth: 435
              }}>
                <div style={{
                  display: 'flex',
                  gap: 10,
                  transform: `translateX(-${dateScrollIndex * 85}px)`,
                  transition: 'transform 0.4s ease-out'
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
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                          backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          width: 75,
                          minWidth: 75,
                          flexShrink: 0,
                          transition: 'border 0.2s, background-color 0.2s'
                        }}
                      >
                        <div style={{
                          fontSize: 13,
                          color: isSelected ? styles.accentColor : '#666',
                          fontWeight: 500,
                          marginBottom: 2
                        }}>
                          {d.day}
                        </div>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: isSelected ? styles.accentColor : styles.headingColor
                        }}>
                          {d.date} {d.month}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => scrollDates('right')}
                disabled={dateScrollIndex >= availableDates.length - 5}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  backgroundColor: '#fff',
                  cursor: dateScrollIndex >= availableDates.length - 5 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: dateScrollIndex >= availableDates.length - 5 ? 0.4 : 1,
                  flexShrink: 0
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Time Slots */}
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: styles.headingColor,
              marginBottom: 16
            }}>
              Select time of day
            </h3>

            <div
              ref={slotsContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: 24,
                maxHeight: 260
              }}
            >
              {slotsLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  Loading slots...
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  No slots available for this date.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10
                }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '14px 8px',
                          borderRadius: 10,
                          border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                          backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                          color: isSelected ? styles.accentColor : styles.textColor,
                          transition: 'all 0.2s'
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
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 14,
                fontWeight: 600,
                color: styles.headingColor,
                marginBottom: 10,
                display: 'block'
              }}>
                Timezone
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid #e5e5e5',
                  fontSize: 14,
                  color: styles.textColor,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center'
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
                padding: '18px',
                borderRadius: 12,
                border: 'none',
                backgroundColor: selectedDate && selectedSlot ? styles.primaryColor : '#ccc',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Fill Form - Desktop */}
      {step === 2 && (
        <div style={{ maxWidth: 650, margin: '0 auto' }}>
          <div style={{
            backgroundColor: styles.cardBackgroundColor,
            borderRadius: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={styles.headingColor} strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <div style={{
                  width: 44,
                  height: 44,
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
                    <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>G</span>
                  )}
                </div>
                <span style={{ fontWeight: 500, color: styles.headingColor, fontSize: 16 }}>
                  {settings?.hostName || 'Ved Patel'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{settings?.hostRating || 5}/5</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '28px' }}>
              {/* Title */}
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: styles.headingColor,
                marginBottom: 8
              }}>
                {settings?.meetingTitle || "Book A Direct Call With Our Founder's Team"}
              </h2>
              <p style={{ color: '#666', fontSize: 15, marginBottom: 24 }}>
                {settings?.callType || 'Video Call'} | {settings?.slotDuration || 30}mins
              </p>

              {/* Selected Date/Time Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: 14,
                marginBottom: 28
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #e5e5e5',
                    textAlign: 'center',
                    minWidth: 50
                  }}>
                    <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>
                      {formatDateCard(selectedDate).month}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: styles.headingColor }}>
                      {formatDateCard(selectedDate).date}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: styles.headingColor, fontSize: 15 }}>
                      {formatDateLong(selectedDate)}
                    </div>
                    <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                      {formatTime(selectedSlot)} - {getEndTime(selectedSlot, settings?.slotDuration || 30)} (GMT +05:30)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid #e5e5e5',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 14
                  }}
                >
                  Change
                </button>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, color: styles.headingColor }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      borderRadius: 10,
                      border: errors.name ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.name}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, color: styles.headingColor }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      borderRadius: 10,
                      border: errors.email ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.email && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, color: styles.headingColor }}>
                    Name of the company (write N/A if the name is not decided yet)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      borderRadius: 10,
                      border: errors.companyName ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.companyName && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.companyName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, color: styles.headingColor }}>
                    Tell us more about your brand & products
                  </label>
                  <input
                    type="text"
                    value={formData.brandDetails}
                    onChange={(e) => setFormData({ ...formData, brandDetails: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      borderRadius: 10,
                      border: errors.brandDetails ? '1px solid #ef4444' : '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.brandDetails && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.brandDetails}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, color: styles.headingColor }}>
                    What is your biggest challenge around your brand?
                  </label>
                  <input
                    type="text"
                    value={formData.challenge}
                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      borderRadius: 10,
                      border: '1px solid #e5e5e5',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, color: styles.headingColor }}>Phone number</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '15px 14px',
                      borderRadius: 10,
                      border: '1px solid #e5e5e5',
                      backgroundColor: '#f9fafb'
                    }}>
                      <span style={{ fontSize: 18 }}>🇮🇳</span>
                      <span style={{ fontWeight: 500 }}>+91</span>
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
                        padding: '15px 18px',
                        borderRadius: 10,
                        border: errors.phone ? '1px solid #ef4444' : '1px solid #e5e5e5',
                        fontSize: 15,
                        outline: 'none'
                      }}
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.phone}</span>}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={receiveOnPhone}
                    onChange={(e) => setReceiveOnPhone(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: 14, color: styles.textColor }}>Receive booking details on phone</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 28px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: styles.headingColor }}>{priceDisplay}</div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '16px 36px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: styles.primaryColor,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
