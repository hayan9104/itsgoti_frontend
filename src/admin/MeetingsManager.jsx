import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';

const API_BASE = '/api';

// ─────────────────────────────────────────────────
// Main Meetings Manager - with sub-navigation
// ─────────────────────────────────────────────────
const MeetingsManager = () => {
  const location = useLocation();

  // Get base path for meetings (remove any sub-routes)
  const basePath = location.pathname.split('/meetings')[0] + '/meetings';

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        Meeting Management
      </h1>

      {/* Sub Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
        <NavLink
          to={basePath}
          end
          style={({ isActive }) => ({
            padding: '8px 16px',
            borderRadius: 6,
            textDecoration: 'none',
            backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
            color: isActive ? '#fff' : '#374151',
            fontWeight: 500,
            fontSize: 14,
          })}
        >
          Bookings
        </NavLink>
        <NavLink
          to={`${basePath}/settings`}
          style={({ isActive }) => ({
            padding: '8px 16px',
            borderRadius: 6,
            textDecoration: 'none',
            backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
            color: isActive ? '#fff' : '#374151',
            fontWeight: 500,
            fontSize: 14,
          })}
        >
          Settings
        </NavLink>
        <NavLink
          to={`${basePath}/form-editor`}
          style={({ isActive }) => ({
            padding: '8px 16px',
            borderRadius: 6,
            textDecoration: 'none',
            backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
            color: isActive ? '#fff' : '#374151',
            fontWeight: 500,
            fontSize: 14,
          })}
        >
          Form Editor
        </NavLink>
      </div>

      <Routes>
        <Route path="" element={<BookingsView />} />
        <Route path="settings" element={<MeetingSettingsView />} />
        <Route path="form-editor" element={<FormEditorView />} />
      </Routes>
    </div>
  );
};

// ─────────────────────────────────────────────────
// Bookings View - List all bookings with filters
// ─────────────────────────────────────────────────
const BookingsView = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, todayBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const query = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`${API_BASE}/bookings${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchBookings(), fetchStats()]).finally(() => setLoading(false));
  }, [filter]);

  const handleApprove = async (bookingId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
        fetchStats();
        setSelectedBooking(null);
        alert('Booking approved! Email sent to customer with Meet link.');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error approving booking');
    }
    setActionLoading(false);
  };

  const handleDeny = async (bookingId, reason) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/deny`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ denialReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
        fetchStats();
        setSelectedBooking(null);
        alert('Booking denied. Customer has been notified.');
      }
    } catch (error) {
      alert('Error denying booking');
    }
    setActionLoading(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', color: '#92400e' };
      case 'approved': return { bg: '#d1fae5', color: '#065f46' };
      case 'denied': return { bg: '#fee2e2', color: '#991b1b' };
      case 'completed': return { bg: '#e0e7ff', color: '#3730a3' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Bookings', value: stats.total, color: '#6b7280' },
          { label: 'Pending', value: stats.pending, color: '#f59e0b' },
          { label: 'Approved', value: stats.approved, color: '#10b981' },
          { label: 'Today', value: stats.todayBookings, color: '#3b82f6' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'denied', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: filter === f ? '#111827' : '#f3f4f6',
              color: filter === f ? '#fff' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#374151' }}>Customer</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#374151' }}>Date & Time</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#374151' }}>Company</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#374151' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: 13, color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const statusStyle = getStatusColor(booking.status);
                return (
                  <tr key={booking._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>{booking.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{booking.email}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{booking.phone}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>{formatDate(booking.date)}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{formatTime(booking.timeSlot)}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>{booking.companyName}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fff',
                          color: '#374151',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Booking Details</h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Customer</div>
              <div style={{ fontWeight: 500 }}>{selectedBooking.name}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>{selectedBooking.email}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>{selectedBooking.phone}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Date & Time</div>
              <div style={{ fontWeight: 500 }}>{formatDate(selectedBooking.date)} at {formatTime(selectedBooking.timeSlot)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Company</div>
              <div style={{ fontWeight: 500 }}>{selectedBooking.companyName}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>About Brand</div>
              <div style={{ fontSize: 14 }}>{selectedBooking.brandDetails}</div>
            </div>

            {selectedBooking.challenge && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Challenge</div>
                <div style={{ fontSize: 14 }}>{selectedBooking.challenge}</div>
              </div>
            )}

            {selectedBooking.meetLink && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Meet Link</div>
                <a href={selectedBooking.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: 14 }}>
                  {selectedBooking.meetLink}
                </a>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: getStatusColor(selectedBooking.status).bg,
                  color: getStatusColor(selectedBooking.status).color,
                  textTransform: 'capitalize',
                }}
              >
                {selectedBooking.status}
              </span>
            </div>

            {/* Action Buttons */}
            {selectedBooking.status === 'pending' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleApprove(selectedBooking._id)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Approve & Create Meet'}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Reason for denial (optional):');
                    handleDeny(selectedBooking._id, reason || '');
                  }}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  Deny
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedBooking(null)}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                color: '#374151',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────
// Meeting Settings View
// ─────────────────────────────────────────────────
const MeetingSettingsView = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedDayDate, setSelectedDayDate] = useState({});
  const [togglingSlot, setTogglingSlot] = useState(null);
  const [initialSettings, setInitialSettings] = useState(null);

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!initialSettings || !settings) return false;
    return JSON.stringify(settings) !== initialSettings;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setInitialSettings(JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setInitialSettings(JSON.stringify(settings));
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings');
      }
    } catch (error) {
      alert('Error saving settings');
    }
    setSaving(false);
  };

  const toggleDay = (day) => {
    setSettings((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          enabled: !prev.weeklySchedule[day].enabled,
        },
      },
    }));
  };

  const updateDayTime = (day, index, field, value) => {
    setSettings((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>;
  }

  if (!settings) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>Error loading settings</div>;
  }

  return (
    <div>
      {/* Booking Status Toggle */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Booking Status</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Enable or disable booking for users</p>
          </div>
          <button
            onClick={() => setSettings((prev) => ({ ...prev, bookingEnabled: !prev.bookingEnabled }))}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: settings.bookingEnabled ? '#10b981' : '#ef4444',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {settings.bookingEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Slot Duration */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Slot Duration</h3>
        <select
          value={settings.slotDuration}
          onChange={(e) => setSettings((prev) => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            fontSize: 14,
            width: 200,
          }}
        >
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={20}>20 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
      </div>

      {/* Weekly Schedule */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Weekly Hours</h3>

        {days.map((day) => {
          const daySchedule = settings.weeklySchedule[day];
          const isExpanded = expandedDay === day;

          // Generate slots for this day
          const generateDaySlots = () => {
            if (!daySchedule.enabled || !daySchedule.timeSlots.length) return [];
            const slots = [];
            const duration = settings.slotDuration || 30;
            for (const timeRange of daySchedule.timeSlots) {
              const [startHour, startMin] = timeRange.start.split(':').map(Number);
              const [endHour, endMin] = timeRange.end.split(':').map(Number);
              let currentMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              while (currentMinutes + duration <= endMinutes) {
                const hours = Math.floor(currentMinutes / 60);
                const mins = currentMinutes % 60;
                slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
                currentMinutes += duration;
              }
            }
            return slots;
          };

          // Get next 4 occurrences of this day
          const getUpcomingDates = () => {
            const dates = [];
            const dayIndex = days.indexOf(day);
            const today = new Date();
            let checkDate = new Date(today);

            // Find the next occurrence of this day
            while (checkDate.getDay() !== dayIndex) {
              checkDate.setDate(checkDate.getDate() + 1);
            }

            // Get next 4 occurrences
            for (let i = 0; i < 4; i++) {
              dates.push(new Date(checkDate));
              checkDate.setDate(checkDate.getDate() + 7);
            }
            return dates;
          };

          const formatTime12 = (timeStr) => {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          };

          const upcomingDates = getUpcomingDates();
          const daySlots = generateDaySlots();
          const currentSelectedDate = selectedDayDate[day] || (upcomingDates[0] ? upcomingDates[0].toISOString().split('T')[0] : '');

          const isSlotDisabled = (date, time) => {
            return settings.disabledSlots?.some(s => s.date === date && s.time === time);
          };

          const toggleSlot = async (date, time) => {
            const isDisabled = isSlotDisabled(date, time);
            setTogglingSlot(`${date}-${time}`);
            try {
              const token = localStorage.getItem('token');
              const endpoint = isDisabled ? 'enable-slot' : 'disable-slot';
              const res = await fetch(`${API_BASE}/meeting-settings/${endpoint}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date, time }),
              });
              const data = await res.json();
              if (data.success) {
                fetchSettings();
              }
            } catch (error) {
              console.error('Error toggling slot:', error);
            }
            setTogglingSlot(null);
          };

          return (
            <div key={day} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 0',
                }}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggleDay(day)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    backgroundColor: daySchedule.enabled ? '#10b981' : '#e5e7eb',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: daySchedule.enabled ? 23 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>

                {/* Day Name */}
                <div style={{ width: 100, fontWeight: 500, textTransform: 'capitalize' }}>{day}</div>

                {/* Time Inputs */}
                {daySchedule.enabled && daySchedule.timeSlots.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="time"
                      value={daySchedule.timeSlots[0]?.start || '09:00'}
                      onChange={(e) => updateDayTime(day, 0, 'start', e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        fontSize: 14,
                      }}
                    />
                    <span style={{ color: '#6b7280' }}>to</span>
                    <input
                      type="time"
                      value={daySchedule.timeSlots[0]?.end || '17:00'}
                      onChange={(e) => updateDayTime(day, 0, 'end', e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        fontSize: 14,
                      }}
                    />
                    {/* Expand Button */}
                    <button
                      onClick={() => {
                        setExpandedDay(isExpanded ? null : day);
                        if (!selectedDayDate[day] && upcomingDates[0]) {
                          setSelectedDayDate(prev => ({ ...prev, [day]: upcomingDates[0].toISOString().split('T')[0] }));
                        }
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        backgroundColor: isExpanded ? '#2563eb' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                      }}
                      title="Manage individual time slots"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isExpanded ? '#fff' : '#6b7280'}
                        strokeWidth="2"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: 14 }}>Unavailable</span>
                )}
              </div>

              {/* Expanded Slots Section */}
              {isExpanded && daySchedule.enabled && (
                <div style={{
                  padding: '16px 20px 20px',
                  marginLeft: 60,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  marginBottom: 12,
                }}>
                  {/* Date Selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginRight: 12 }}>
                      Select Date:
                    </label>
                    <select
                      value={currentSelectedDate}
                      onChange={(e) => setSelectedDayDate(prev => ({ ...prev, [day]: e.target.value }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        fontSize: 14,
                        backgroundColor: '#fff',
                      }}
                    >
                      {upcomingDates.map((date) => (
                        <option key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                          {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Slots Grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {daySlots.map((slot) => {
                      const isDisabled = isSlotDisabled(currentSelectedDate, slot);
                      const isToggling = togglingSlot === `${currentSelectedDate}-${slot}`;
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleSlot(currentSelectedDate, slot)}
                          disabled={isToggling}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 6,
                            border: isDisabled ? '2px solid #ef4444' : '1px solid #d1d5db',
                            backgroundColor: isToggling ? '#f3f4f6' : isDisabled ? '#fef2f2' : '#fff',
                            color: isDisabled ? '#991b1b' : '#374151',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isToggling ? 'wait' : 'pointer',
                            textDecoration: isDisabled ? 'line-through' : 'none',
                            opacity: isToggling ? 0.6 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          {formatTime12(slot)}
                        </button>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 12 }}>
                    Click on a time slot to disable/enable it. Disabled slots appear crossed out in red.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Notifications */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Admin Notifications</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Admin Email</label>
          <input
            type="email"
            value={settings.adminEmail || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, adminEmail: e.target.value }))}
            placeholder="admin@example.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Admin WhatsApp (for future use)</label>
          <input
            type="tel"
            value={settings.adminWhatsApp || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, adminWhatsApp: e.target.value }))}
            placeholder="+919876543210"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Max Advance Days */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Booking Window</h3>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Max Advance Days</label>
          <input
            type="number"
            value={settings.maxAdvanceDays || 30}
            onChange={(e) => setSettings((prev) => ({ ...prev, maxAdvanceDays: parseInt(e.target.value) }))}
            min={1}
            max={90}
            style={{
              width: 100,
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
            }}
          />
          <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 13 }}>days</span>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            How far in advance users can book (1-90 days)
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges()}
        style={{
          padding: '12px 32px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: hasChanges() ? '#2563eb' : '#9ca3af',
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          cursor: (saving || !hasChanges()) ? 'not-allowed' : 'pointer',
          opacity: (saving || !hasChanges()) ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving...' : hasChanges() ? 'Save Settings' : 'No Changes'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────
// Form Editor View - Visual editor for booking form
// ─────────────────────────────────────────────────
const defaultFormFieldsConfig = [
  { id: 'name', label: 'Name', placeholder: 'Your full name', type: 'text', required: true, enabled: true },
  { id: 'email', label: 'Email', placeholder: 'your@email.com', type: 'email', required: true, enabled: true },
  { id: 'phone', label: 'Phone', placeholder: '9876543210', type: 'tel', required: true, enabled: true },
  { id: 'companyName', label: 'Company Name', placeholder: 'Your company name', type: 'text', required: true, enabled: true },
  { id: 'brandDetails', label: 'About Your Brand', placeholder: 'Brief description of your brand and what you sell...', type: 'textarea', required: true, enabled: true },
  { id: 'challenge', label: 'Your Biggest Challenge', placeholder: 'What challenges are you facing?', type: 'textarea', required: false, enabled: true },
];

const FormEditorView = () => {
  const [settings, setSettings] = useState({ slotDuration: 30, meetingTitle: 'Book a Call' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [formFields, setFormFields] = useState(defaultFormFieldsConfig);
  const [initialData, setInitialData] = useState(null);

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!initialData) return false;
    const currentData = JSON.stringify({ formFields, meetingTitle: settings.meetingTitle, slotDuration: settings.slotDuration });
    return currentData !== initialData;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/meeting-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setSettings(data.data);
          const fields = data.data.formFields && data.data.formFields.length > 0
            ? data.data.formFields
            : defaultFormFieldsConfig;
          setFormFields(fields);
          // Store initial data for comparison
          setInitialData(JSON.stringify({
            formFields: fields,
            meetingTitle: data.data.meetingTitle,
            slotDuration: data.data.slotDuration
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
      if (isMounted) setLoading(false);
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        formFields,
        meetingTitle: settings.meetingTitle,
        slotDuration: settings.slotDuration,
      };
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Update initial data after successful save
        setInitialData(JSON.stringify({
          formFields,
          meetingTitle: settings.meetingTitle,
          slotDuration: settings.slotDuration
        }));
        alert('Form saved successfully!');
      } else {
        alert('Error saving form: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving form');
    }
    setSaving(false);
  };

  const toggleField = (fieldId) => {
    setFormFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const updateField = (fieldId, updates) => {
    setFormFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    ));
  };

  const addField = () => {
    const newId = `custom_${Date.now()}`;
    const newField = {
      id: newId,
      label: 'New Field',
      placeholder: 'Enter value...',
      type: 'text',
      required: false,
      enabled: true,
      isCustom: true,
    };
    setFormFields(prev => [...prev, newField]);
    setSelectedField(newId);
  };

  const deleteField = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      setFormFields(prev => prev.filter(f => f.id !== fieldId));
      setSelectedField(null);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 250px)' }}>
      {/* Left Sidebar - Fields List */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: 16,
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            borderRadius: 6,
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
              <strong>Tip:</strong> Click on any field to edit. Use the toggle to show/hide fields.
            </p>
          </div>

          {/* Meeting Header Settings */}
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Header
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Meeting Title</label>
              <input
                type="text"
                value={settings.meetingTitle || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, meetingTitle: e.target.value }))}
                placeholder="Book a Call with Our Team"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Duration (mins)</label>
              <select
                value={settings.slotDuration || 30}
                onChange={(e) => setSettings(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                }}
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Form Fields
          </h3>

          {formFields.map((field) => (
            <div
              key={field.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                marginBottom: 8,
                borderRadius: 8,
                backgroundColor: selectedField === field.id ? '#eff6ff' : '#f9fafb',
                border: selectedField === field.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => setSelectedField(field.id)}
            >
              {/* Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleField(field.id);
                }}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: field.enabled ? '#10b981' : '#d1d5db',
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: field.enabled ? 18 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }} />
              </button>

              {/* Field Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: field.enabled ? '#111827' : '#9ca3af',
                  textDecoration: field.enabled ? 'none' : 'line-through',
                }}>
                  {field.label}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {field.type === 'textarea' ? 'Text Area' : 'Text Input'}
                  {field.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                </div>
              </div>

              {/* Arrow */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}

          {/* Add Field Button */}
          <button
            onClick={addField}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: 8,
              borderRadius: 8,
              border: '2px dashed #d1d5db',
              backgroundColor: '#fff',
              color: '#6b7280',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Field
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: hasChanges() ? '#2563eb' : '#9ca3af',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: (saving || !hasChanges()) ? 'not-allowed' : 'pointer',
            opacity: (saving || !hasChanges()) ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : hasChanges() ? 'Save Form' : 'No Changes'}
        </button>
      </div>

      {/* Right - Preview & Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Field Editor Panel */}
        {selectedField && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                Edit Field: {formFields.find(f => f.id === selectedField)?.label}
              </h3>
              <button
                onClick={() => setSelectedField(null)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Label</label>
                <input
                  type="text"
                  value={formFields.find(f => f.id === selectedField)?.label || ''}
                  onChange={(e) => updateField(selectedField, { label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Placeholder</label>
                <input
                  type="text"
                  value={formFields.find(f => f.id === selectedField)?.placeholder || ''}
                  onChange={(e) => updateField(selectedField, { placeholder: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Field Type</label>
                <select
                  value={formFields.find(f => f.id === selectedField)?.type || 'text'}
                  onChange={(e) => updateField(selectedField, { type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                  }}
                >
                  <option value="text">Text Input</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="textarea">Text Area</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Required</label>
                <button
                  onClick={() => {
                    const field = formFields.find(f => f.id === selectedField);
                    updateField(selectedField, { required: !field?.required });
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: formFields.find(f => f.id === selectedField)?.required ? '#10b981' : '#e5e7eb',
                    color: formFields.find(f => f.id === selectedField)?.required ? '#fff' : '#374151',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {formFields.find(f => f.id === selectedField)?.required ? 'Required' : 'Optional'}
                </button>
              </div>
            </div>

            {/* Delete Button for Custom Fields */}
            {formFields.find(f => f.id === selectedField)?.isCustom && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => deleteField(selectedField)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Delete Field
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form Preview */}
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: 8,
          padding: 24,
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'auto',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 450,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
              {settings?.meetingTitle || 'Book a Call'}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, textAlign: 'center' }}>
              {settings?.slotDuration || 30} mins • Google Meet
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formFields.filter(f => f.enabled).map((field) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field.id)}
                  style={{
                    cursor: 'pointer',
                    padding: 2,
                    borderRadius: 8,
                    border: selectedField === field.id ? '2px solid #2563eb' : '2px solid transparent',
                  }}
                >
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder}
                      rows={3}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                        resize: 'none',
                        backgroundColor: '#f9fafb',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                        backgroundColor: '#f9fafb',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              style={{
                width: '100%',
                marginTop: 20,
                padding: '14px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'default',
              }}
            >
              Book Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsManager;
