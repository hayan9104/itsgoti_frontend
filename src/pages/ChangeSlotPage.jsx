import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = '/api';

const ChangeSlotPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dateScrollIndex, setDateScrollIndex] = useState(0);
  const slotsContainerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pageAnimated, setPageAnimated] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

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
    fetchBookingAndDates();
  }, [token]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchBookingAndDates = async () => {
    try {
      // Fetch booking info using token
      const bookingRes = await fetch(`${API_BASE}/bookings/change/${token}`);
      const bookingData = await bookingRes.json();

      if (!bookingData.success) {
        setError(bookingData.message || 'Invalid or expired link');
        setLoading(false);
        return;
      }

      setBooking(bookingData.data);

      // Fetch available dates
      const datesRes = await fetch(`${API_BASE}/bookings/available-dates`);
      const datesData = await datesRes.json();

      if (datesData.success) {
        setAvailableDates(datesData.data);
        setSettings(datesData.settings || {});
        if (datesData.data.length > 0) {
          setSelectedDate(datesData.data[0].date);
        }
      }
    } catch (err) {
      setError('Failed to load booking information. Please try again.');
      console.error('Error:', err);
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
        setSelectedSlot(null);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
    setSlotsLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/bookings/change/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: selectedDate,
          newTimeSlot: selectedSlot,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || 'Failed to update booking. Please try again.');
      }
    } catch (err) {
      alert('Error updating booking. Please try again.');
      console.error('Error:', err);
    }
    setSubmitting(false);
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

  const scrollDates = (direction) => {
    const maxScroll = Math.max(0, availableDates.length - 5);
    if (direction === 'left') {
      setDateScrollIndex(Math.max(0, dateScrollIndex - 1));
    } else {
      setDateScrollIndex(Math.min(maxScroll, dateScrollIndex + 1));
    }
  };

  // Loading state
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

  // Error state
  if (error) {
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
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, marginBottom: 12, color: styles.headingColor }}>
            Link Expired
          </h2>
          <p style={{ color: styles.textColor, marginBottom: 32, lineHeight: 1.6, fontSize: isMobile ? 14 : 16 }}>
            {error}
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>
            Please contact us to get a new link for changing your booking slot.
          </p>
        </div>
      </div>
    );
  }

  // Success state
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
            Booking Updated!
          </h2>
          <p style={{ color: styles.textColor, marginBottom: 32, lineHeight: 1.6, fontSize: isMobile ? 14 : 16 }}>
            Your meeting has been rescheduled successfully. You'll receive confirmation on WhatsApp and Email.
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 16,
            padding: isMobile ? 20 : 24,
            textAlign: 'left',
            marginBottom: 32
          }}>
            <div style={{ marginBottom: 12, fontSize: isMobile ? 14 : 15 }}>
              <strong>New Date:</strong> {formatDateLong(selectedDate)}
            </div>
            <div style={{ marginBottom: 12, fontSize: isMobile ? 14 : 15 }}>
              <strong>New Time:</strong> {formatTime(selectedSlot)} IST
            </div>
            <div style={{ fontSize: isMobile ? 14 : 15 }}>
              <strong>Duration:</strong> {settings?.slotDuration || booking?.duration || 30} minutes
            </div>
          </div>
          <p style={{ color: '#666', fontSize: 14 }}>
            You can close this page now.
          </p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
            <span style={{ fontSize: 15, fontWeight: 500, color: styles.headingColor }}>It's Goti</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: styles.headingColor,
            lineHeight: 1.3,
            marginBottom: 8
          }}>
            Change Your Booking Slot
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            Hi {booking?.name}, select a new date and time for your meeting.
          </p>

          {/* Current Booking Info */}
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 6 }}>CURRENT BOOKING</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#78350f' }}>
              {formatDateLong(booking?.date)} at {formatTime(booking?.timeSlot)}
            </div>
          </div>

          {/* Date Selection */}
          <h3 style={{ fontSize: 16, fontWeight: 600, color: styles.headingColor, marginBottom: 16 }}>
            Select new date & time
          </h3>

          <div style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 12,
            marginBottom: 16,
            scrollbarWidth: 'none',
          }}>
            {availableDates.slice(0, 7).map((item) => {
              const d = formatDateCard(item.date);
              const isSelected = selectedDate === item.date;
              const isCurrent = item.date === booking?.date;
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
                    border: isSelected ? `2px solid ${styles.accentColor}` : isCurrent ? '2px solid #fcd34d' : '1px solid #e5e5e5',
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
          </div>

          {/* Next Available + Confirm */}
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: 12
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                {selectedSlot ? 'New slot' : 'Select a slot'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: styles.headingColor }}>
                {selectedSlot
                  ? `${formatTime(selectedSlot)}, ${formatDateLong(selectedDate)}`
                  : 'Choose date & time'
                }
              </div>
            </div>
            <button
              onClick={() => {
                if (selectedSlot) {
                  handleSubmit();
                } else {
                  setShowBottomSheet(true);
                }
              }}
              disabled={!selectedSlot || submitting}
              style={{
                padding: '14px 28px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: selectedSlot ? styles.primaryColor : '#ccc',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: selectedSlot && !submitting ? 'pointer' : 'not-allowed',
                opacity: selectedSlot && !submitting ? 1 : 0.6
              }}
            >
              {submitting ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </div>

        {/* Bottom Sheet Modal */}
        {showBottomSheet && (
          <>
            <div
              onClick={() => setShowBottomSheet(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 100
              }}
            />
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
              <div style={{ width: 40, height: 4, backgroundColor: '#e5e5e5', borderRadius: 2, margin: '0 auto 16px' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: styles.headingColor, margin: 0 }}>
                  Select new slot
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
                Available times
              </h4>
              {slotsLoading ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>Loading slots...</div>
              ) : availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>No slots available for this date</div>
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

              {/* Confirm Button */}
              <button
                onClick={() => {
                  if (selectedSlot) {
                    setShowBottomSheet(false);
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
                Select This Slot
              </button>
            </div>
          </>
        )}

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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: 700,
        width: '100%',
        backgroundColor: styles.cardBackgroundColor,
        borderRadius: 24,
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transform: pageAnimated ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(30px)',
        opacity: pageAnimated ? 1 : 0,
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>G</span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: styles.headingColor, margin: 0 }}>
              Change Your Booking Slot
            </h1>
            <p style={{ color: '#666', fontSize: 15, margin: '6px 0 0' }}>
              Hi {booking?.name}, select a new date and time for your meeting.
            </p>
          </div>
        </div>

        {/* Current Booking Info */}
        <div style={{
          backgroundColor: '#fef3c7',
          borderRadius: 14,
          padding: 20,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#fcd34d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>CURRENT BOOKING</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#78350f' }}>
              {formatDateLong(booking?.date)} at {formatTime(booking?.timeSlot)}
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: styles.headingColor, marginBottom: 20 }}>
          Select new date
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
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

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              gap: 10,
              transform: `translateX(-${dateScrollIndex * 95}px)`,
              transition: 'transform 0.4s ease-out'
            }}>
              {availableDates.map((item) => {
                const d = formatDateCard(item.date);
                const isSelected = selectedDate === item.date;
                return (
                  <button
                    key={item.date}
                    onClick={() => setSelectedDate(item.date)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 14,
                      border: isSelected ? `2px solid ${styles.accentColor}` : '1px solid #e5e5e5',
                      backgroundColor: isSelected ? `${styles.accentColor}15` : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      width: 85,
                      minWidth: 85,
                      flexShrink: 0
                    }}
                  >
                    <div style={{ fontSize: 13, color: isSelected ? styles.accentColor : '#666', fontWeight: 500 }}>{d.day}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: isSelected ? styles.accentColor : styles.headingColor }}>{d.date} {d.month}</div>
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
        <h3 style={{ fontSize: 16, fontWeight: 600, color: styles.headingColor, marginBottom: 16 }}>
          Select new time
        </h3>

        <div ref={slotsContainerRef} style={{ marginBottom: 32, maxHeight: 240, overflowY: 'auto' }}>
          {slotsLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading slots...</div>
          ) : availableSlots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No slots available for this date.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
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

        {/* Confirm Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedSlot || submitting}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: 14,
            border: 'none',
            backgroundColor: selectedDate && selectedSlot ? styles.primaryColor : '#ccc',
            color: '#fff',
            fontSize: 17,
            fontWeight: 600,
            cursor: selectedDate && selectedSlot && !submitting ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {submitting ? 'Updating Booking...' : 'Confirm New Slot'}
        </button>
      </div>
    </div>
  );
};

export default ChangeSlotPage;
