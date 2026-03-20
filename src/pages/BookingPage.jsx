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
  const slotsContainerRef = useRef(null);

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
    if (direction === 'left') {
      setDateScrollIndex(Math.max(0, dateScrollIndex - 1));
    } else {
      setDateScrollIndex(Math.min(maxScroll, dateScrollIndex + 1));
    }
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
          padding: 48,
          maxWidth: 500,
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
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: styles.headingColor }}>
            Booking Submitted!
          </h2>
          <p style={{ color: styles.textColor, marginBottom: 32, lineHeight: 1.6, fontSize: 16 }}>
            Your booking request has been submitted. We'll review and send you a confirmation email with the meeting link shortly.
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 16,
            padding: 24,
            textAlign: 'left',
            marginBottom: 32
          }}>
            <div style={{ marginBottom: 12, fontSize: 15 }}>
              <strong>Date:</strong> {formatDateLong(selectedDate)}
            </div>
            <div style={{ marginBottom: 12, fontSize: 15 }}>
              <strong>Time:</strong> {formatTime(selectedSlot)} IST
            </div>
            <div style={{ fontSize: 15 }}>
              <strong>Duration:</strong> {settings?.slotDuration || 30} minutes
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '16px 48px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: styles.primaryColor,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

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
          flexWrap: 'wrap'
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
              onClick={() => navigate('/')}
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
              <ol style={{
                margin: 0,
                paddingLeft: 24,
                color: styles.textColor,
                lineHeight: 2,
                fontSize: 15
              }}>
                {descriptionBullets.map((bullet, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{bullet}</li>
                ))}
              </ol>
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
                display: 'flex',
                gap: 10,
                flex: 1,
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {visibleDates.map((item) => {
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
                        minWidth: 75,
                        transition: 'all 0.2s'
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

      {/* Step 2: Fill Form */}
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
                    <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

              {/* Order Summary */}
              <div style={{ marginTop: 28, border: '1px solid #e5e5e5', borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Order Summary</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{priceDisplay === 'FREE' ? '₹0' : priceDisplay}</span>
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"
                      style={{ transform: showSummary ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {showSummary && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                      <span style={{ color: styles.textColor }}>1 x {settings?.meetingTitle || "Book a Direct Call"}</span>
                      <span>{priceDisplay === 'FREE' ? '₹0' : priceDisplay}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                      <span style={{ color: styles.textColor }}>Platform fee</span>
                      <span><s style={{ color: '#999' }}>₹10</s> <span style={{ color: '#10b981', fontWeight: 500 }}>FREE</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontWeight: 600, fontSize: 15 }}>
                      <span>Total</span>
                      <span>{priceDisplay === 'FREE' ? '₹0' : priceDisplay}</span>
                    </div>
                  </div>
                )}
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

          {/* Security Note */}
          <div style={{ textAlign: 'center', marginTop: 28, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Payments are 100% secure & encrypted
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
