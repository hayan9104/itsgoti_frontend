import { useState, useEffect } from 'react';

const API_BASE = '/api';

const BookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Date, 2: Time, 3: Details, 4: Success
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [settings, setSettings] = useState({ slotDuration: 30, meetingTitle: '' });

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch available dates on mount
  useEffect(() => {
    if (isOpen) {
      fetchAvailableDates();
    }
  }, [isOpen]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableDates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/available-dates`);
      const data = await res.json();
      if (data.success) {
        setAvailableDates(data.data);
        setSettings(data.settings || { slotDuration: 30 });
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
    setLoading(false);
  };

  const fetchAvailableSlots = async (date) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/slots/${date}`);
      const data = await res.json();
      if (data.success) {
        setAvailableSlots(data.data);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.brandDetails.trim()) newErrors.brandDetails = 'Brand details are required';

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
          source: 'Landing Page 2',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
        if (onSuccess) onSuccess(data);
      } else {
        alert(data.message || 'Error booking. Please try again.');
      }
    } catch (error) {
      alert('Error submitting booking. Please try again.');
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setFormData({ name: '', email: '', phone: '', companyName: '', brandDetails: '', challenge: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        overflow: 'hidden',
      }}
      onClick={handleClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: step === 3 ? '500px' : '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
              {step === 4 ? 'Booking Confirmed!' : settings.meetingTitle || 'Book a Call'}
            </h2>
            {step !== 4 && (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                {settings.slotDuration} mins • Google Meet
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        {step !== 4 && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: step >= s ? '#2563eb' : '#e5e7eb',
                      color: step >= s ? '#fff' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {step > s ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '13px', color: step >= s ? '#111827' : '#9ca3af', fontWeight: step === s ? 600 : 400 }}>
                    {s === 1 ? 'Date' : s === 2 ? 'Time' : 'Details'}
                  </span>
                  {s < 3 && <div style={{ width: '30px', height: '2px', backgroundColor: step > s ? '#2563eb' : '#e5e7eb' }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
                Select a Date
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
              ) : availableDates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No available dates. Please check back later.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                  {availableDates.slice(0, 14).map((item) => {
                    const d = formatDate(item.date);
                    const isSelected = selectedDate === item.date;
                    return (
                      <button
                        key={item.date}
                        onClick={() => {
                          setSelectedDate(item.date);
                          setSelectedSlot(null);
                        }}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                          backgroundColor: isSelected ? '#eff6ff' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{d.day}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{d.date}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{d.month}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedDate && (
                <button
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  padding: 0,
                }}
              >
                ← Back
              </button>

              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  📅 {formatDate(selectedDate).full}
                </span>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
                Select a Time Slot
              </h3>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
              ) : availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No slots available for this date. Please select another date.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                          backgroundColor: isSelected ? '#eff6ff' : '#fff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#111827',
                          transition: 'all 0.15s',
                        }}
                      >
                        {formatTime(slot)}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlot && (
                <button
                  onClick={() => setStep(3)}
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* Step 3: Enter Details */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  padding: 0,
                }}
              >
                ← Back
              </button>

              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  📅 {formatDate(selectedDate).full}
                </div>
                <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
                  🕐 {formatTime(selectedSlot)} ({settings.slotDuration} mins)
                </div>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
                Enter Your Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block', color: '#374151' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.name ? '1px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Your full name"
                  />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.name}</span>}
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block', color: '#374151' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="your@email.com"
                  />
                  {errors.email && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.email}</span>}
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block', color: '#374151' }}>
                    Phone *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      color: '#374151',
                    }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: errors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.phone}</span>}
                </div>

                {/* Company Name */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block', color: '#374151' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.companyName ? '1px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Your company name"
                  />
                  {errors.companyName && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.companyName}</span>}
                </div>

                {/* Brand Details */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block', color: '#374151' }}>
                    Tell us about your brand & products *
                  </label>
                  <textarea
                    value={formData.brandDetails}
                    onChange={(e) => setFormData({ ...formData, brandDetails: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.brandDetails ? '1px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Brief description of your brand and what you sell..."
                  />
                  {errors.brandDetails && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.brandDetails}</span>}
                </div>

                {/* Challenge (Optional) */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block', color: '#374151' }}>
                    What is your biggest challenge? (Optional)
                  </label>
                  <textarea
                    value={formData.challenge}
                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    placeholder="What challenges are you facing with your brand?"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Booking...' : 'Book Meeting'}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Booking Submitted!
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                Your booking request has been submitted. We'll review and send you a confirmation email with the meeting link shortly.
              </p>

              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                  <strong>Date:</strong> {formatDate(selectedDate).full}
                </div>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                  <strong>Time:</strong> {formatTime(selectedSlot)} IST
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  <strong>Duration:</strong> {settings.slotDuration} minutes
                </div>
              </div>

              <button
                onClick={handleClose}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
