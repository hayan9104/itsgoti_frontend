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
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details'); // 'details' or 'chats'
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Chat input state
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [windowStatus, setWindowStatus] = useState({ windowOpen: false });
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (selectedBooking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedBooking]);

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

  const fetchChatHistory = async (bookingId) => {
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/whatsapp/conversation/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setChatHistory(data.data.history || []);
      } else {
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatHistory([]);
    } finally {
      setChatLoading(false);
    }
  };

  // Check 24hr window status
  const checkWindowStatus = async (phone) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/whatsapp/window-status/${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWindowStatus(data);
      }
    } catch (error) {
      console.error('Error checking window status:', error);
    }
  };

  // Send message to user
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedBooking?.phone) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: selectedBooking.phone,
          message: messageInput.trim(),
          forceOpen: true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessageInput('');
        // Refresh chat history
        fetchChatHistory(selectedBooking._id);
      } else {
        const errMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error || 'Failed to send message');
        alert(errMsg);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Send media to user
  const handleSendMedia = async (mediaType, mediaUrl, caption = '', filename = '') => {
    if (!selectedBooking?.phone) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: selectedBooking.phone,
          mediaType,
          mediaUrl,
          caption,
          filename,
          forceOpen: true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowAttachMenu(false);
        fetchChatHistory(selectedBooking._id);
      } else {
        const errMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error || 'Failed to send media');
        alert(errMsg);
      }
    } catch (error) {
      console.error('Error sending media:', error);
      alert('Failed to send media');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e, mediaType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Close attach menu
    setShowAttachMenu(false);

    // Ask for optional caption
    const caption = prompt(`Add a caption (optional):`) || '';

    // Upload file first
    const formData = new FormData();
    formData.append('file', file);

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const uploadRes = await fetch(`${API_BASE}/upload/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.url) {
        await handleSendMedia(mediaType, uploadData.url, caption, file.name);
      } else {
        alert(uploadData.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setSendingMessage(false);
    }

    // Reset file input
    e.target.value = '';
  };

  useEffect(() => {
    Promise.all([fetchBookings(), fetchStats()]).finally(() => setLoading(false));
  }, [filter]);

  // Mark booking as viewed and open drawer
  const handleViewBooking = async (booking) => {
    // Open drawer immediately and reset to details tab
    setSelectedBooking(booking);
    setDrawerTab('details');
    setChatHistory([]);
    setMessageInput('');
    setWindowStatus({ windowOpen: false });

    // Fetch chat history and window status in background
    fetchChatHistory(booking._id);
    if (booking.phone) {
      checkWindowStatus(booking.phone);
    }

    // If not viewed, mark as viewed in background
    if (!booking.isViewed) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/bookings/${booking._id}/viewed`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        // Update local state
        setBookings(prev =>
          prev.map(b => b._id === booking._id ? { ...b, isViewed: true } : b)
        );
      } catch (error) {
        console.error('Error marking as viewed:', error);
      }
    }
  };

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
      case 'rescheduled': return { bg: '#dbeafe', color: '#1e40af' };
      case 'reschedule_denied': return { bg: '#fce7f3', color: '#9d174d' };
      case 'cancelled': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'reschedule_denied': return 'Reschedule Denied';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Get display status - shows "Rescheduled" if booking was rescheduled
  const getDisplayStatus = (booking) => {
    if (booking.rescheduledFrom && booking.status === 'approved') {
      return 'rescheduled';
    }
    return booking.status;
  };

  // Filter and sort bookings
  const getFilteredBookings = () => {
    let filtered = [...bookings];

    // Status filter - use display status for filtering
    if (filter !== 'all') {
      filtered = filtered.filter(b => getDisplayStatus(b) === filter);
    }

    // Date range filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (dateRange === 'today') {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      });
    } else if (dateRange === 'week') {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= startOfWeek;
      });
    } else if (dateRange === 'month') {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= startOfMonth;
      });
    } else if (dateRange === 'custom' && customDateStart && customDateEnd) {
      const start = new Date(customDateStart);
      const end = new Date(customDateEnd);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= start && bookingDate <= end;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name?.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.phone?.includes(query) ||
        b.companyName?.toLowerCase().includes(query)
      );
    }

    // Sort by when booking was created (createdAt), not meeting date
    filtered.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      } else if (sortBy === 'date_asc') {
        return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
      } else if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Calculate dynamic stats from filtered bookings
  const today = new Date().toISOString().split('T')[0];
  const filteredStats = {
    total: filteredBookings.length,
    pending: filteredBookings.filter(b => b.status === 'pending').length,
    approved: filteredBookings.filter(b => b.status === 'approved').length,
    todayBookings: filteredBookings.filter(b => b.date === today).length,
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Bookings', value: filteredStats.total, color: '#6b7280' },
          { label: 'Pending', value: filteredStats.pending, color: '#f59e0b' },
          { label: 'Approved', value: filteredStats.approved, color: '#10b981' },
          { label: 'Today', value: filteredStats.todayBookings, color: '#3b82f6' },
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

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        alignItems: 'center',
      }}>
        {/* Search Box */}
        <div style={{ flex: '1 1 280px', minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, phone, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div style={{ minWidth: 140 }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 32px 10px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: '#fff',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="reschedule_denied">Reschedule Denied</option>
            <option value="denied">Denied</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Date Range Dropdown */}
        <div style={{ minWidth: 150 }}>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setShowCustomDate(e.target.value === 'custom');
            }}
            style={{
              width: '100%',
              padding: '10px 32px 10px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: '#fff',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div style={{ minWidth: 160 }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 32px 10px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: '#fff',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
            }}
          >
            <option value="date_desc">Booked (Newest)</option>
            <option value="date_asc">Booked (Oldest)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>

        {/* Results Count */}
        <div style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
          {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomDate && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          padding: 16,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>From:</span>
          <input
            type="date"
            value={customDateStart}
            onChange={(e) => setCustomDateStart(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
            }}
          />
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>To:</span>
          <input
            type="date"
            value={customDateEnd}
            onChange={(e) => setCustomDateEnd(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
            }}
          />
          <button
            onClick={() => {
              setShowCustomDate(false);
              setDateRange('all');
              setCustomDateStart('');
              setCustomDateEnd('');
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      )}

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
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                  {bookings.length === 0 ? 'No bookings found' : 'No bookings match your filters'}
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {
                const displayStatus = getDisplayStatus(booking);
                const statusStyle = getStatusColor(displayStatus);
                const isUnread = !booking.isViewed;
                return (
                  <tr
                    key={booking._id}
                    style={{
                      borderTop: '1px solid #e5e7eb',
                      backgroundColor: isUnread ? '#eff6ff' : 'transparent',
                      borderLeft: isUnread ? '3px solid #3b82f6' : '3px solid transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isUnread && (
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            flexShrink: 0,
                          }} />
                        )}
                        <div>
                          <div style={{ fontWeight: isUnread ? 700 : 500, color: '#111827' }}>{booking.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: isUnread ? 500 : 400 }}>{booking.email}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{booking.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: isUnread ? 700 : 500, color: '#111827' }}>{formatDate(booking.date)}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{formatTime(booking.timeSlot)}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: isUnread ? 700 : 500, color: '#111827' }}>{booking.companyName}</div>
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
                        {getStatusLabel(displayStatus)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewBooking(booking)}
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

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '100%',
              maxWidth: 600,
              backgroundColor: '#fff',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: drawerTab === 'chats' ? '#075e54' : '#fff',
            }}>
              {drawerTab === 'chats' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#25d366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 16,
                  }}>
                    {selectedBooking?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 16 }}>
                      {selectedBooking?.name || 'User'}
                    </div>
                    <div style={{ fontSize: 12, color: '#d1fae5' }}>
                      {selectedBooking?.phone || ''}
                    </div>
                  </div>
                </div>
              ) : (
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Booking Details</h2>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: drawerTab === 'chats' ? '#fff' : '#6b7280',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}>
              <button
                onClick={() => setDrawerTab('details')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: drawerTab === 'details' ? '#fff' : 'transparent',
                  borderBottom: drawerTab === 'details' ? '2px solid #2563eb' : '2px solid transparent',
                  color: drawerTab === 'details' ? '#2563eb' : '#6b7280',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Details
              </button>
              <button
                onClick={() => setDrawerTab('chats')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: drawerTab === 'chats' ? '#fff' : 'transparent',
                  borderBottom: drawerTab === 'chats' ? '2px solid #2563eb' : '2px solid transparent',
                  color: drawerTab === 'chats' ? '#2563eb' : '#6b7280',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                Chats
                {chatHistory.length > 0 && (
                  <span style={{
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontSize: 11,
                  }}>
                    {chatHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {/* Details Tab */}
              {drawerTab === 'details' && (
                <div>
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
                        backgroundColor: getStatusColor(getDisplayStatus(selectedBooking)).bg,
                        color: getStatusColor(getDisplayStatus(selectedBooking)).color,
                        textTransform: 'capitalize',
                      }}
                    >
                      {getStatusLabel(getDisplayStatus(selectedBooking))}
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
                          padding: '12px 16px',
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
                          padding: '12px 16px',
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
                </div>
              )}

              {/* Chats Tab - WhatsApp Style */}
              {drawerTab === 'chats' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#0b141a',
                  backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABfSURBVHgB7dAxAQAACAOgaWP/zjACBIkHAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYOoBLGUAATXl7+8AAAAASUVORK5CYII=")',
                  margin: -20,
                  marginBottom: -20,
                  height: 'calc(100% + 40px)',
                }}>
                  {/* Messages Area */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 16,
                  }}>
                  {chatLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#8696a0' }}>
                      Loading chat history...
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#8696a0' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                      <div>No chat history found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>WhatsApp messages will appear here</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(() => {
                        // Template to message mapping
                        const getTemplateMessage = (templateName, booking, msg) => {
                          const name = booking?.name || 'Customer';
                          const date = booking?.date ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
                          const time = booking?.timeSlot || '';
                          const meetLink = booking?.meetLink || '';
                          const phone = booking?.phone || '';
                          const companyName = booking?.companyName || '';

                          const templates = {
                            'booking_received': {
                              text: `Hi ${name}! 👋\n\nYour booking request:\n📅 ${date}\n⏰ ${time}\n\nPlease confirm or change your slot.`,
                              buttons: ['Ok', 'Change Slot']
                            },
                            'booking_confirmed': {
                              text: `Great news, ${name}! ✅\n\nYour booking is confirmed:\n📅 ${date}\n⏰ ${time}\n\nWe look forward to seeing you!`,
                              buttons: ['Ok', 'Reschedule']
                            },
                            'booking_denied': {
                              text: `Hi ${name},\n\nUnfortunately, your requested slot is not available.\n\nPlease select a new slot.`,
                              buttons: ['Select New Slot']
                            },
                            'slot_change': {
                              text: `Hi ${name},\n\nClick below to change your booking slot:\n📅 Current: ${date} at ${time}`,
                              buttons: ['Change Slot']
                            },
                            'reschedule_approved': {
                              text: `Your reschedule request has been approved! ✅\n\n📅 New Date: ${date}\n⏰ New Time: ${time}\n\nWe look forward to seeing you!`,
                              buttons: ['Ok', 'Change Again']
                            },
                            'reschedule_denied': {
                              text: `Hi ${name},\n\nYour reschedule request could not be approved.\n\nPlease select a different slot.`,
                              buttons: ['Select New Slot']
                            },
                            'contact_inquiry': {
                              text: `Hi ${name}! 👋\n\nThank you for contacting It's Goti.\n\nWe've received your inquiry and will get back to you shortly.\n\nCompany: ${companyName}`,
                              buttons: []
                            },
                            'meeting_reminder': {
                              text: `Hi ${name}! ⏰\n\nReminder: Your meeting is coming up!\n\n📅 ${date}\n⏰ ${time}\n🔗 ${meetLink || 'Meeting link will be shared'}\n\nSee you soon!`,
                              buttons: ['Cancel Meeting', 'Reschedule']
                            },
                            'meeting_reminder_admin': {
                              text: `📋 Meeting Reminder\n\nClient: ${name}\n📅 ${date}\n⏰ ${time}\n📞 ${phone}`,
                              buttons: ['Cancel Meeting', 'Reschedule']
                            },
                            'follow_up': {
                              text: `Hi ${name}! 👋\n\nWe wanted to follow up on your recent booking inquiry.\n\nAre you still interested in scheduling a meeting with us?`,
                              buttons: ['Yes, Continue', 'Reschedule', 'Cancel']
                            },
                            'booking_cancelled': {
                              text: `Hi ${name},\n\nYour booking has been cancelled.\n\n📅 ${date}\n⏰ ${time}\n\nFeel free to book again anytime!`,
                              buttons: []
                            },
                          };
                          return templates[templateName] || null;
                        };

                        // Find next message to see which button was clicked
                        const getNextButtonClick = (currentIndex) => {
                          for (let i = currentIndex + 1; i < chatHistory.length; i++) {
                            if (chatHistory[i].direction === 'inbound' && chatHistory[i].buttonClicked) {
                              return chatHistory[i].buttonClicked;
                            }
                            if (chatHistory[i].direction === 'outbound') break;
                          }
                          return null;
                        };

                        let lastDate = null;
                        return chatHistory.map((msg, index) => {
                          const msgDate = msg.timestamp ? new Date(msg.timestamp) : new Date();
                          const dateStr = msgDate.toDateString();
                          const showDateSeparator = dateStr !== lastDate;
                          lastDate = dateStr;

                          const today = new Date().toDateString();
                          const yesterday = new Date(Date.now() - 86400000).toDateString();
                          let dateLabel = msgDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                          if (dateStr === today) dateLabel = 'Today';
                          else if (dateStr === yesterday) dateLabel = 'Yesterday';

                          const timeStr = msgDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                          const isOutbound = msg.direction === 'outbound';

                          // Get display content and buttons
                          let displayContent = msg.content || '';
                          let buttons = [];
                          let clickedButton = null;
                          let templateLabel = null;

                          // Check if this is a template message (outbound)
                          const templateName = msg.templateName || (msg.content && /^[a-z_]+$/.test(msg.content) ? msg.content : null);
                          if (isOutbound && templateName) {
                            const templateData = getTemplateMessage(templateName, selectedBooking, msg);
                            if (templateData) {
                              displayContent = templateData.text;
                              buttons = templateData.buttons || [];
                              clickedButton = getNextButtonClick(index);
                            } else {
                              // Unknown template - show a friendly label
                              const friendlyNames = {
                                'contact_inquiry': 'Contact Form Acknowledgment',
                                'meeting_reminder': 'Meeting Reminder',
                                'meeting_reminder_admin': 'Admin Meeting Reminder',
                                'follow_up': 'Follow-up Message',
                                'booking_received': 'Booking Confirmation',
                                'booking_confirmed': 'Booking Approved',
                                'booking_denied': 'Booking Denied',
                              };
                              templateLabel = friendlyNames[templateName] || templateName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              displayContent = `📨 ${templateLabel}\n\nTemplate message sent to ${selectedBooking?.name || 'customer'}`;
                            }
                          }

                          // For inbound messages (from user)
                          if (!isOutbound) {
                            // If it's a button click, show it as user's response
                            if (msg.buttonClicked) {
                              displayContent = `"${msg.buttonClicked}"`;
                            } else if (msg.content) {
                              // Regular text message from user
                              displayContent = msg.content;
                            } else {
                              return null;
                            }
                          }

                          if (!displayContent) return null;

                          return (
                            <div key={index}>
                              {showDateSeparator && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  margin: '12px 0',
                                }}>
                                  <span style={{
                                    backgroundColor: '#182229',
                                    color: '#8696a0',
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                  }}>
                                    {dateLabel}
                                  </span>
                                </div>
                              )}
                              <div style={{
                                display: 'flex',
                                justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                                marginBottom: 4,
                              }}>
                                <div style={{ maxWidth: '80%' }}>
                                  {/* Message Bubble */}
                                  <div style={{
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    backgroundColor: isOutbound ? '#005c4b' : '#202c33',
                                    borderTopRightRadius: isOutbound ? 0 : 8,
                                    borderTopLeftRadius: isOutbound ? 8 : 0,
                                    borderBottomLeftRadius: buttons.length > 0 ? 0 : 8,
                                    borderBottomRightRadius: buttons.length > 0 ? 0 : 8,
                                  }}>
                                    {/* Sender Label */}
                                    {!isOutbound && (
                                      <div style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#25d366',
                                        marginBottom: 4,
                                      }}>
                                        {selectedBooking?.name || 'Customer'}
                                      </div>
                                    )}
                                    <div style={{
                                      fontSize: 14,
                                      color: '#e9edef',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                    }}>
                                      {displayContent || 'Message'}
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'flex-end',
                                      alignItems: 'center',
                                      gap: 4,
                                      marginTop: 4,
                                    }}>
                                      <span style={{ fontSize: 11, color: '#8696a0' }}>
                                        {timeStr}
                                      </span>
                                      {isOutbound && (
                                        <span style={{ color: '#53bdeb', fontSize: 14 }}>✓✓</span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Buttons */}
                                  {buttons.length > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      borderTop: '1px solid #0b141a',
                                    }}>
                                      {buttons.map((btn, btnIndex) => {
                                        const isClicked = clickedButton && btn.toLowerCase().includes(clickedButton.toLowerCase().split(' ')[0]);
                                        return (
                                          <div
                                            key={btnIndex}
                                            style={{
                                              flex: 1,
                                              padding: '10px 8px',
                                              textAlign: 'center',
                                              backgroundColor: isClicked ? '#25d366' : '#1f2c33',
                                              color: isClicked ? '#fff' : '#00a884',
                                              fontSize: 14,
                                              fontWeight: 500,
                                              borderLeft: btnIndex > 0 ? '1px solid #0b141a' : 'none',
                                              borderBottomLeftRadius: btnIndex === 0 ? 8 : 0,
                                              borderBottomRightRadius: btnIndex === buttons.length - 1 ? 8 : 0,
                                            }}
                                          >
                                            {btn}
                                            {isClicked && ' ✓'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }).filter(Boolean);
                      })()}
                    </div>
                  )}
                  </div>

                  {/* Message Input Bar */}
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#202c33',
                    borderTop: '1px solid #2a3942',
                  }}>
                    {/* Window Status Info */}
                    {!windowStatus.windowOpen && (
                      <div style={{
                        fontSize: 11,
                        color: '#f59e0b',
                        marginBottom: 8,
                        textAlign: 'center',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: 4,
                      }}>
                        ⚠️ 24-hour window may be closed. Messages will be force-sent.
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      {/* Attachment Button */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowAttachMenu(!showAttachMenu)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#8696a0',
                            fontSize: 22,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          +
                        </button>

                        {/* Attachment Menu */}
                        {showAttachMenu && (
                          <div style={{
                            position: 'absolute',
                            bottom: 50,
                            left: 0,
                            backgroundColor: '#233138',
                            borderRadius: 12,
                            padding: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            minWidth: 180,
                          }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderRadius: 8,
                              color: '#e9edef',
                            }}>
                              <span style={{ fontSize: 20 }}>🖼️</span>
                              <span>Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(e, 'image')}
                              />
                            </label>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderRadius: 8,
                              color: '#e9edef',
                            }}>
                              <span style={{ fontSize: 20 }}>🎬</span>
                              <span>Video</span>
                              <input
                                type="file"
                                accept="video/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(e, 'video')}
                              />
                            </label>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderRadius: 8,
                              color: '#e9edef',
                            }}>
                              <span style={{ fontSize: 20 }}>📄</span>
                              <span>Document</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(e, 'document')}
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Emoji Button */}
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#8696a0',
                          fontSize: 22,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        😊
                      </button>

                      {/* Text Input */}
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={'Type a message'}
                        disabled={sendingMessage}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: 24,
                          border: 'none',
                          backgroundColor: '#2a3942',
                          color: '#e9edef',
                          fontSize: 14,
                          outline: 'none',
                          opacity: 1,
                        }}
                      />

                      {/* Send Button */}
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendingMessage}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: messageInput.trim() ? '#00a884' : 'transparent',
                          color: messageInput.trim() ? '#fff' : '#8696a0',
                          fontSize: 18,
                          cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {sendingMessage ? '...' : '➤'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Close Button */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  width: '100%',
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
      {/* Save Button - Top (right aligned, smaller) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={handleSave} disabled={saving || !hasChanges()} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: (saving || !hasChanges()) ? 'not-allowed' : 'pointer',
          backgroundColor: hasChanges() ? '#2563eb' : '#9ca3af', color: '#fff', opacity: (saving || !hasChanges()) ? 0.6 : 1
        }}>{saving ? 'Saving...' : hasChanges() ? 'Save Changes' : 'No Changes'}</button>
      </div>

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

      {/* Slot Change Days - How many days visible when user changes slot */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Slot Change Days</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>How many days to show when user wants to change/reschedule their booking</p>
          </div>
          <select
            value={settings.slotChangeDays ?? 7}
            onChange={(e) => setSettings((prev) => ({ ...prev, slotChangeDays: parseInt(e.target.value) }))}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              width: 150,
            }}
          >
            <option value={0}>Same day only</option>
            <option value={1}>1 day</option>
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* Media Follow-up Settings */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Media Follow-up</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Send brochures, videos, or documents to users after they answer questions</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.mediaFollowup?.enabled || false}
              onChange={(e) => setSettings((prev) => ({
                ...prev,
                mediaFollowup: { ...prev.mediaFollowup, enabled: e.target.checked }
              }))}
              style={{ width: 18, height: 18, marginRight: 8 }}
            />
            <span style={{ fontSize: 14 }}>Enable</span>
          </label>
        </div>

        {settings.mediaFollowup?.enabled && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            {/* Delay Hours */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Send after (hours)
              </label>
              <select
                value={settings.mediaFollowup?.delayHours ?? 2}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  mediaFollowup: { ...prev.mediaFollowup, delayHours: parseInt(e.target.value) }
                }))}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14, width: 150 }}
              >
                <option value={0}>Immediately</option>
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Question to ask user
              </label>
              <input
                type="text"
                value={settings.mediaFollowup?.questionText || 'Would you like me to share our brochure/documents with you?'}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  mediaFollowup: { ...prev.mediaFollowup, questionText: e.target.value }
                }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
              />
            </div>

            {/* Media Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Media Items</label>
                <button
                  onClick={() => {
                    const newItem = {
                      name: '',
                      type: 'document',
                      url: '',
                      caption: '',
                      filename: ''
                    };
                    setSettings((prev) => ({
                      ...prev,
                      mediaFollowup: {
                        ...prev.mediaFollowup,
                        mediaItems: [...(prev.mediaFollowup?.mediaItems || []), newItem]
                      }
                    }));
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  + Add Media
                </button>
              </div>

              {(settings.mediaFollowup?.mediaItems || []).length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20, backgroundColor: '#f9fafb', borderRadius: 6 }}>
                  No media items added. Click "+ Add Media" to add images, videos, or documents.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(settings.mediaFollowup?.mediaItems || []).map((item, index) => (
                    <div key={index} style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        {/* Type */}
                        <select
                          value={item.type}
                          onChange={(e) => {
                            const updated = [...settings.mediaFollowup.mediaItems];
                            updated[index] = { ...item, type: e.target.value };
                            setSettings((prev) => ({
                              ...prev,
                              mediaFollowup: { ...prev.mediaFollowup, mediaItems: updated }
                            }));
                          }}
                          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
                        >
                          <option value="document">Document (PDF)</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>

                        {/* Name */}
                        <input
                          type="text"
                          placeholder="Name (e.g., Company Brochure)"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...settings.mediaFollowup.mediaItems];
                            updated[index] = { ...item, name: e.target.value };
                            setSettings((prev) => ({
                              ...prev,
                              mediaFollowup: { ...prev.mediaFollowup, mediaItems: updated }
                            }));
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
                        />

                        {/* Delete */}
                        <button
                          onClick={() => {
                            const updated = settings.mediaFollowup.mediaItems.filter((_, i) => i !== index);
                            setSettings((prev) => ({
                              ...prev,
                              mediaFollowup: { ...prev.mediaFollowup, mediaItems: updated }
                            }));
                          }}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      {/* URL */}
                      <input
                        type="text"
                        placeholder="URL (https://example.com/file.pdf)"
                        value={item.url}
                        onChange={(e) => {
                          const updated = [...settings.mediaFollowup.mediaItems];
                          updated[index] = { ...item, url: e.target.value };
                          setSettings((prev) => ({
                            ...prev,
                            mediaFollowup: { ...prev.mediaFollowup, mediaItems: updated }
                          }));
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 8 }}
                      />

                      <div style={{ display: 'flex', gap: 12 }}>
                        {/* Filename (for documents) */}
                        {item.type === 'document' && (
                          <input
                            type="text"
                            placeholder="Filename (e.g., Brochure.pdf)"
                            value={item.filename}
                            onChange={(e) => {
                              const updated = [...settings.mediaFollowup.mediaItems];
                              updated[index] = { ...item, filename: e.target.value };
                              setSettings((prev) => ({
                                ...prev,
                                mediaFollowup: { ...prev.mediaFollowup, mediaItems: updated }
                              }));
                            }}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
                          />
                        )}

                        {/* Caption */}
                        <input
                          type="text"
                          placeholder="Caption (optional)"
                          value={item.caption}
                          onChange={(e) => {
                            const updated = [...settings.mediaFollowup.mediaItems];
                            updated[index] = { ...item, caption: e.target.value };
                            setSettings((prev) => ({
                              ...prev,
                              mediaFollowup: { ...prev.mediaFollowup, mediaItems: updated }
                            }));
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Auto Messages - Scheduled WhatsApp messages after booking */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Auto Messages</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Send scheduled WhatsApp messages (videos, images, PDFs) to users after booking</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.autoMessages?.enabled || false}
              onChange={(e) => setSettings((prev) => ({
                ...prev,
                autoMessages: { ...prev.autoMessages, enabled: e.target.checked }
              }))}
              style={{ width: 18, height: 18, marginRight: 8 }}
            />
            <span style={{ fontSize: 14 }}>Enable</span>
          </label>
        </div>

        {settings.autoMessages?.enabled && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            {/* Time Window */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Send messages between
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="time"
                  value={settings.autoMessages?.startTime || '19:00'}
                  onChange={(e) => setSettings((prev) => ({
                    ...prev,
                    autoMessages: { ...prev.autoMessages, startTime: e.target.value }
                  }))}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                />
                <span style={{ color: '#6b7280' }}>to</span>
                <input
                  type="time"
                  value={settings.autoMessages?.endTime || '21:00'}
                  onChange={(e) => setSettings((prev) => ({
                    ...prev,
                    autoMessages: { ...prev.autoMessages, endTime: e.target.value }
                  }))}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                Messages will only be sent during this time window (IST)
              </p>
            </div>

            {/* Message Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Messages to Send</label>
                <button
                  onClick={() => {
                    const currentItems = settings.autoMessages?.items || [];
                    const newItem = {
                      text: '',
                      mediaType: 'none',
                      mediaUrl: '',
                      filename: '',
                      order: currentItems.length
                    };
                    setSettings((prev) => ({
                      ...prev,
                      autoMessages: {
                        ...prev.autoMessages,
                        items: [...(prev.autoMessages?.items || []), newItem]
                      }
                    }));
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  + Add Message
                </button>
              </div>

              {(settings.autoMessages?.items || []).length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20, backgroundColor: '#f9fafb', borderRadius: 6 }}>
                  No messages added. Click "+ Add Message" to add text, videos, images, or documents.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(settings.autoMessages?.items || []).map((item, index) => (
                    <div key={index} style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Message #{index + 1}</span>
                        <button
                          onClick={() => {
                            const updated = settings.autoMessages.items.filter((_, i) => i !== index);
                            setSettings((prev) => ({
                              ...prev,
                              autoMessages: { ...prev.autoMessages, items: updated }
                            }));
                          }}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        {/* Media Type */}
                        <select
                          value={item.mediaType || 'none'}
                          onChange={(e) => {
                            const updated = [...settings.autoMessages.items];
                            updated[index] = { ...item, mediaType: e.target.value };
                            setSettings((prev) => ({
                              ...prev,
                              autoMessages: { ...prev.autoMessages, items: updated }
                            }));
                          }}
                          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14, width: 140 }}
                        >
                          <option value="none">Text Only</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="document">Document</option>
                        </select>

                        {/* Media URL (if media type selected) */}
                        {item.mediaType && item.mediaType !== 'none' && (
                          <input
                            type="text"
                            placeholder="Media URL (https://...)"
                            value={item.mediaUrl || ''}
                            onChange={(e) => {
                              const updated = [...settings.autoMessages.items];
                              updated[index] = { ...item, mediaUrl: e.target.value };
                              setSettings((prev) => ({
                                ...prev,
                                autoMessages: { ...prev.autoMessages, items: updated }
                              }));
                            }}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                          />
                        )}

                        {/* Filename (for documents) */}
                        {item.mediaType === 'document' && (
                          <input
                            type="text"
                            placeholder="Filename"
                            value={item.filename || ''}
                            onChange={(e) => {
                              const updated = [...settings.autoMessages.items];
                              updated[index] = { ...item, filename: e.target.value };
                              setSettings((prev) => ({
                                ...prev,
                                autoMessages: { ...prev.autoMessages, items: updated }
                              }));
                            }}
                            style={{ width: 150, padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                          />
                        )}
                      </div>

                      {/* Text/Caption */}
                      <textarea
                        placeholder={item.mediaType === 'none' ? 'Message text...' : 'Caption for media (optional)'}
                        value={item.text || ''}
                        onChange={(e) => {
                          const updated = [...settings.autoMessages.items];
                          updated[index] = { ...item, text: e.target.value };
                          setSettings((prev) => ({
                            ...prev,
                            autoMessages: { ...prev.autoMessages, items: updated }
                          }));
                        }}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: '1px solid #e5e7eb',
                          fontSize: 14,
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
  { id: 'name', label: 'Name', placeholder: 'Enter your name', type: 'text', required: true, enabled: true },
  { id: 'email', label: 'Email', placeholder: 'Enter your email', type: 'email', required: true, enabled: true },
  { id: 'companyName', label: 'Name of the company', placeholder: 'Your company name', type: 'text', required: true, enabled: true },
  { id: 'brandDetails', label: 'Tell us more about your brand & products', placeholder: '', type: 'text', required: true, enabled: true },
  { id: 'challenge', label: 'What is your biggest challenge around your brand?', placeholder: '', type: 'text', required: false, enabled: true },
  { id: 'phone', label: 'Phone number', placeholder: '', type: 'tel', required: true, enabled: true },
];

const FormEditorView = () => {
  const [settings, setSettings] = useState({
    slotDuration: 30,
    meetingTitle: "Book a Direct Call with Our Founder's Team",
    hostName: 'Ved Patel',
    hostRating: 5,
    callType: 'Video Call',
    priceAmount: 0,
    pageBackgroundColor: '#1e3a3a',
    cardBackgroundColor: '#ffffff',
    primaryColor: '#000000',
    accentColor: '#f59e0b',
    headingColor: '#111111',
    textColor: '#333333',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [formFields, setFormFields] = useState(defaultFormFieldsConfig);
  const [initialData, setInitialData] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'styling'
  const [previewPage, setPreviewPage] = useState('page1'); // 'page1' or 'page2'
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPreview, setShowPreview] = useState(true);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasChanges = () => {
    if (!initialData) return false;
    const currentData = JSON.stringify({ formFields, settings });
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
          const fields = data.data.formFields?.length > 0 ? data.data.formFields : defaultFormFieldsConfig;
          setFormFields(fields);
          setInitialData(JSON.stringify({ formFields: fields, settings: data.data }));
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
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, formFields }),
      });
      const data = await res.json();
      if (data.success) {
        setInitialData(JSON.stringify({ formFields, settings }));
        alert('Saved successfully!');
      } else {
        alert('Error: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving');
    }
    setSaving(false);
  };

  const toggleField = (fieldId) => setFormFields(prev => prev.map(f => f.id === fieldId ? { ...f, enabled: !f.enabled } : f));
  const updateField = (fieldId, updates) => setFormFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  const addField = () => {
    const newId = `custom_${Date.now()}`;
    setFormFields(prev => [...prev, { id: newId, label: 'New Field', placeholder: '', type: 'text', required: false, enabled: true, isCustom: true }]);
    setSelectedField(newId);
  };
  const deleteField = (fieldId) => { if (window.confirm('Delete this field?')) { setFormFields(prev => prev.filter(f => f.id !== fieldId)); setSelectedField(null); } };

  // Logo upload handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSettings(p => ({ ...p, logoUrl: data.url }));
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error uploading logo');
    }
    setUploadingLogo(false);
  };

  // Color picker component
  const ColorInput = ({ label, value, onChange }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: '#374151' }}>{label}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
          style={{ width: 32, height: 32, padding: 0, border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer' }} />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 12 }} />
      </div>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  const styles = {
    pageBg: settings.pageBackgroundColor || '#1e3a3a',
    cardBg: settings.cardBackgroundColor || '#ffffff',
    primary: settings.primaryColor || '#000000',
    accent: settings.accentColor || '#f59e0b',
    heading: settings.headingColor || '#111111',
    text: settings.textColor || '#333333',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 16 : 20,
      minHeight: isMobile ? 'auto' : 'calc(100vh - 250px)'
    }}>
      {/* Left Panel */}
      <div style={{
        width: isMobile ? '100%' : 320,
        flexShrink: 0,
        order: isMobile ? 1 : 0
      }}>
        {/* Mobile Preview Toggle */}
        {isMobile && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              backgroundColor: showPreview ? '#2563eb' : '#fff',
              color: showPreview ? '#fff' : '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        )}

        {/* Tabs - Content / Styling */}
        <div style={{ display: 'flex', marginBottom: 12, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4 }}>
          <button onClick={() => setActiveTab('content')} style={{
            flex: 1, padding: '10px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            backgroundColor: activeTab === 'content' ? '#fff' : 'transparent', color: activeTab === 'content' ? '#111' : '#6b7280',
            boxShadow: activeTab === 'content' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>{previewPage === 'page1' ? 'Page Content' : 'Form Fields'}</button>
          <button onClick={() => setActiveTab('styling')} style={{
            flex: 1, padding: '10px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            backgroundColor: activeTab === 'styling' ? '#fff' : 'transparent', color: activeTab === 'styling' ? '#111' : '#6b7280',
            boxShadow: activeTab === 'styling' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>Styling</button>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 12, maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
          {activeTab === 'content' ? (
            <>
              {/* PAGE 1 CONTENT - Logo, Host, Title, Price, Bullets */}
              {previewPage === 'page1' ? (
                <>
                  {/* Logo */}
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' }}>Logo & Host</h3>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Logo Image</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Upload Box */}
                      <label style={{
                        width: 80, height: 80, borderRadius: 12, border: '2px dashed #d1d5db', backgroundColor: '#f9fafb',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        overflow: 'hidden', position: 'relative'
                      }}>
                        {settings.logoUrl ? (
                          <>
                            <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <div style={{
                              position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: 0, transition: 'opacity 0.2s'
                            }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                              <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>Change</span>
                            </div>
                          </>
                        ) : uploadingLogo ? (
                          <span style={{ fontSize: 11, color: '#6b7280' }}>Uploading...</span>
                        ) : (
                          <>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Upload</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      </label>
                      {/* Remove Button */}
                      {settings.logoUrl && (
                        <button onClick={() => setSettings(p => ({ ...p, logoUrl: '' }))} style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', backgroundColor: '#fff',
                          color: '#ef4444', fontSize: 11, fontWeight: 500, cursor: 'pointer'
                        }}>Remove</button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Host Name</label>
                      <input type="text" value={settings.hostName || ''} onChange={(e) => setSettings(p => ({ ...p, hostName: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Rating (1-5)</label>
                      <input type="number" min={1} max={5} value={settings.hostRating || 5} onChange={(e) => setSettings(p => ({ ...p, hostRating: parseInt(e.target.value) }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Meeting Info */}
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' }}>Meeting Info</h3>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Meeting Title</label>
                    <input type="text" value={settings.meetingTitle || ''} onChange={(e) => setSettings(p => ({ ...p, meetingTitle: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Call Type</label>
                      <input type="text" value={settings.callType || ''} onChange={(e) => setSettings(p => ({ ...p, callType: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Duration</label>
                      <select value={settings.slotDuration || 30} onChange={(e) => setSettings(p => ({ ...p, slotDuration: parseInt(e.target.value) }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                        <option value={10}>10 min</option><option value={15}>15 min</option><option value={20}>20 min</option>
                        <option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option>
                      </select>
                    </div>
                  </div>

                  {/* Description Bullets */}
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' }}>How We Help (Bullets)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(settings.descriptionBullets?.length > 0 ? settings.descriptionBullets : ['', '', '', '']).map((bullet, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: styles.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                        <input type="text" value={bullet} placeholder={`Point ${i + 1}`}
                          onChange={(e) => {
                            const bullets = settings.descriptionBullets?.length > 0 ? [...settings.descriptionBullets] : ['', '', '', ''];
                            bullets[i] = e.target.value;
                            setSettings(p => ({ ...p, descriptionBullets: bullets }));
                          }}
                          style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <button onClick={() => {
                      const bullets = settings.descriptionBullets?.length > 0 ? [...settings.descriptionBullets, ''] : ['', '', '', '', ''];
                      setSettings(p => ({ ...p, descriptionBullets: bullets }));
                    }} style={{ padding: '8px', borderRadius: 6, border: '2px dashed #d1d5db', backgroundColor: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>+ Add Point</button>
                  </div>
                </>
              ) : (
                /* PAGE 2 CONTENT - Form Fields */
                <>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' }}>Form Fields</h3>
                  {formFields.map((field) => (
                    <div key={field.id} onClick={() => setSelectedField(field.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px', marginBottom: 6, borderRadius: 6, cursor: 'pointer',
                      backgroundColor: selectedField === field.id ? '#eff6ff' : '#f9fafb', border: selectedField === field.id ? '2px solid #2563eb' : '1px solid #e5e7eb'
                    }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleField(field.id); }} style={{
                        width: 32, height: 18, borderRadius: 9, border: 'none', backgroundColor: field.enabled ? '#10b981' : '#d1d5db', position: 'relative', cursor: 'pointer', flexShrink: 0
                      }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: field.enabled ? 16 : 2, transition: 'left 0.2s' }} />
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: field.enabled ? '#111' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.label}</div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addField} style={{
                    width: '100%', padding: '10px', marginTop: 8, borderRadius: 6, border: '2px dashed #d1d5db', backgroundColor: '#fff',
                    color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>+ Add Field</button>

                  {/* Field Editor */}
                  {selectedField && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Edit: {formFields.find(f => f.id === selectedField)?.label}</h4>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Label</label>
                        <input type="text" value={formFields.find(f => f.id === selectedField)?.label || ''} onChange={(e) => updateField(selectedField, { label: e.target.value })}
                          style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Placeholder</label>
                        <input type="text" value={formFields.find(f => f.id === selectedField)?.placeholder || ''} onChange={(e) => updateField(selectedField, { placeholder: e.target.value })}
                          style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => updateField(selectedField, { required: !formFields.find(f => f.id === selectedField)?.required })} style={{
                          padding: '8px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          backgroundColor: formFields.find(f => f.id === selectedField)?.required ? '#10b981' : '#e5e7eb', color: formFields.find(f => f.id === selectedField)?.required ? '#fff' : '#374151'
                        }}>{formFields.find(f => f.id === selectedField)?.required ? 'Required' : 'Optional'}</button>
                        {formFields.find(f => f.id === selectedField)?.isCustom && (
                          <button onClick={() => deleteField(selectedField)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Styling Tab - Colors for both pages */}
              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' }}>Page Colors</h3>
              <ColorInput label="Page Background" value={settings.pageBackgroundColor} onChange={(v) => setSettings(p => ({ ...p, pageBackgroundColor: v }))} />
              <ColorInput label="Card Background" value={settings.cardBackgroundColor} onChange={(v) => setSettings(p => ({ ...p, cardBackgroundColor: v }))} />

              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12, marginTop: 16, textTransform: 'uppercase' }}>Button & Accent</h3>
              <ColorInput label="Primary/Button Color" value={settings.primaryColor} onChange={(v) => setSettings(p => ({ ...p, primaryColor: v }))} />
              <ColorInput label="Accent Color (Selection)" value={settings.accentColor} onChange={(v) => setSettings(p => ({ ...p, accentColor: v }))} />

              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12, marginTop: 16, textTransform: 'uppercase' }}>Text Colors</h3>
              <ColorInput label="Heading Color" value={settings.headingColor} onChange={(v) => setSettings(p => ({ ...p, headingColor: v }))} />
              <ColorInput label="Body Text Color" value={settings.textColor} onChange={(v) => setSettings(p => ({ ...p, textColor: v }))} />
            </>
          )}
        </div>

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving || !hasChanges()} style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: (saving || !hasChanges()) ? 'not-allowed' : 'pointer',
          backgroundColor: hasChanges() ? '#2563eb' : '#9ca3af', color: '#fff', opacity: (saving || !hasChanges()) ? 0.6 : 1
        }}>{saving ? 'Saving...' : hasChanges() ? 'Save Changes' : 'No Changes'}</button>
      </div>

      {/* Right - Topmate Style Preview */}
      {(!isMobile || showPreview) && (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        order: isMobile ? 0 : 1,
        marginBottom: isMobile ? 16 : 0
      }}>
        {/* Page Tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPreviewPage('page1')} style={{
            padding: isMobile ? '8px 16px' : '10px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            backgroundColor: previewPage === 'page1' ? '#2563eb' : '#e5e7eb', color: previewPage === 'page1' ? '#fff' : '#374151'
          }}>Page 1 - Date/Time</button>
          <button onClick={() => setPreviewPage('page2')} style={{
            padding: isMobile ? '8px 16px' : '10px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            backgroundColor: previewPage === 'page2' ? '#2563eb' : '#e5e7eb', color: previewPage === 'page2' ? '#fff' : '#374151'
          }}>Page 2 - Form</button>
        </div>

        {/* Preview Area */}
        <div style={{
          flex: isMobile ? 'none' : 1,
          backgroundColor: styles.pageBg,
          borderRadius: 12,
          padding: isMobile ? 12 : 24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'auto',
          minHeight: isMobile ? 400 : 'auto',
          maxHeight: isMobile ? 500 : 'none'
        }}>

          {/* PAGE 1 - Date/Time Selection */}
          {previewPage === 'page1' && (
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 16 : 20,
              width: '100%',
              maxWidth: 900
            }}>
              {/* Left Info Panel */}
              <div style={{
                backgroundColor: styles.cardBg,
                borderRadius: 16,
                padding: isMobile ? 16 : 24,
                width: isMobile ? '100%' : 320,
                flexShrink: 0
              }}>
                {/* Host Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: styles.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} /> : <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>G</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: styles.heading }}>{settings.hostName || 'Ved Patel'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      <span style={{ fontWeight: 500, fontSize: 13, color: '#666' }}>{settings.hostRating || 5}/5</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: 20, fontWeight: 700, color: styles.heading, marginBottom: 8 }}>{settings.meetingTitle || "Book A Direct Call"}</h2>

                {/* Call Type & Duration */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, backgroundColor: '#f0f0f0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span style={{ fontSize: 12, color: '#666' }}>{settings.callType || 'Video Call'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, backgroundColor: '#f0f0f0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    <span style={{ fontSize: 12, color: '#666' }}>{settings.slotDuration || 30} mins</span>
                  </div>
                </div>

                {/* Description Title */}
                <h3 style={{ fontSize: 14, fontWeight: 600, color: styles.heading, marginBottom: 12 }}>How we will help you:</h3>

                {/* Bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(settings.descriptionBullets?.length > 0 ? settings.descriptionBullets : [
                    'Ask questions to understand your vision & challenges',
                    'Break any myths that might be holding you back',
                    'Walk you through our industry leading process',
                    'See if this is a good fit, if yes then take it forward!'
                  ]).map((bullet, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: styles.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: styles.text, lineHeight: 1.5 }}>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Calendar & Time */}
              <div style={{
                flex: 1,
                backgroundColor: styles.cardBg,
                borderRadius: 16,
                padding: isMobile ? 16 : 24,
                width: isMobile ? '100%' : 'auto'
              }}>
                {/* Month Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e5e5', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <span style={{ fontWeight: 600, fontSize: 16, color: styles.heading }}>March 2026</span>
                  <button style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e5e5', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>

                {/* Calendar Grid */}
                <div style={{ marginBottom: 24 }}>
                  {/* Day Labels */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#999', padding: '8px 0' }}>{d}</div>
                    ))}
                  </div>
                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {[...Array(31)].map((_, i) => {
                      const isSelected = i === 20; // 21st selected
                      const isPast = i < 19;
                      return (
                        <div key={i} style={{
                          padding: '10px 0', textAlign: 'center', borderRadius: 8, cursor: isPast ? 'default' : 'pointer',
                          backgroundColor: isSelected ? styles.accent : 'transparent',
                          color: isSelected ? '#fff' : isPast ? '#ccc' : styles.heading,
                          fontWeight: isSelected ? 600 : 400, fontSize: 14
                        }}>{i + 1}</div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Label */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: styles.heading }}>Available Time Slots</span>
                </div>

                {/* Time Slots Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'].map((time, i) => {
                    const isSelected = i === 0;
                    return (
                      <div key={i} style={{
                        padding: '12px', textAlign: 'center', borderRadius: 8, cursor: 'pointer',
                        border: isSelected ? `2px solid ${styles.accent}` : '1px solid #e5e5e5',
                        backgroundColor: isSelected ? styles.accent + '20' : '#fff',
                        color: isSelected ? styles.accent : styles.text, fontWeight: 500, fontSize: 13
                      }}>{time}</div>
                    );
                  })}
                </div>

                {/* Confirm Button */}
                <button style={{ width: '100%', marginTop: 24, padding: '14px', borderRadius: 10, border: 'none', backgroundColor: styles.primary, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Confirm Date & Time
                </button>
              </div>
            </div>
          )}

          {/* PAGE 2 - Form */}
          {previewPage === 'page2' && (
            <div style={{
              backgroundColor: styles.cardBg,
              borderRadius: isMobile ? 12 : 20,
              width: '100%',
              maxWidth: isMobile ? '100%' : 550,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: isMobile ? '12px 16px' : '18px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.heading} strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: '50%', backgroundColor: styles.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} /> : <span style={{ color: '#fff', fontSize: isMobile ? 12 : 14, fontWeight: 600 }}>G</span>}
                  </div>
                  <span style={{ fontWeight: 500, color: styles.heading, fontSize: isMobile ? 13 : 15 }}>{settings.hostName || 'Ved Patel'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{settings.hostRating || 5}/5</span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: isMobile ? '16px' : '24px' }}>
                <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: styles.heading, marginBottom: 6 }}>{settings.meetingTitle || "Book A Direct Call"}</h2>
                <p style={{ color: '#666', fontSize: isMobile ? 12 : 14, marginBottom: isMobile ? 16 : 20 }}>{settings.callType || 'Video Call'} | {settings.slotDuration || 30}mins</p>

                {/* Date/Time Selection Preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '12px' : '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 12,
                  marginBottom: isMobile ? 16 : 24,
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  gap: isMobile ? 10 : 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
                    <div style={{ backgroundColor: '#fff', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, border: '1px solid #e5e5e5', textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? 10 : 11, color: '#666' }}>MAR</div>
                      <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: styles.heading }}>21</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: styles.heading, fontSize: isMobile ? 12 : 14 }}>Sat, 21 Mar</div>
                      <div style={{ fontSize: isMobile ? 11 : 13, color: '#666' }}>09:00 AM - 09:30 AM</div>
                    </div>
                  </div>
                  <button style={{ padding: isMobile ? '6px 12px' : '8px 16px', borderRadius: 8, border: '1px solid #e5e5e5', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: isMobile ? 11 : 13 }}>Change</button>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {formFields.filter(f => f.enabled).map((field) => (
                    <div key={field.id} onClick={() => setSelectedField(field.id)} style={{
                      cursor: 'pointer', padding: 3, borderRadius: 10, border: selectedField === field.id ? `2px solid ${styles.accent}` : '2px solid transparent'
                    }}>
                      <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: styles.heading, fontSize: 14 }}>
                        {field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}
                      </label>
                      {field.id === 'phone' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 8, border: '1px solid #e5e5e5', backgroundColor: '#f9fafb' }}>
                            <span>🇮🇳</span><span style={{ fontWeight: 500 }}>+91</span>
                          </div>
                          <input type="tel" placeholder={field.placeholder} readOnly style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 14, backgroundColor: '#fff' }} />
                        </div>
                      ) : (
                        <input type={field.type} placeholder={field.placeholder} readOnly style={{
                          width: '100%', padding: '13px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box'
                        }} />
                      )}
                    </div>
                  ))}

                  {/* Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#10b981' }} />
                    <span style={{ fontSize: 13, color: styles.text }}>Receive booking details on phone</span>
                  </label>
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: isMobile ? '12px 16px' : '18px 24px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                backgroundColor: '#fafafa'
              }}>
                <button style={{
                  padding: isMobile ? '10px 20px' : '14px 32px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: styles.primary,
                  color: '#fff',
                  fontSize: isMobile ? 13 : 15,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>Book Session</button>
              </div>
            </div>
          )}

        </div>
      </div>
      )}
    </div>
  );
};

export default MeetingsManager;
