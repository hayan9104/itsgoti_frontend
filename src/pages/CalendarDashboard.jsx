import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { pagesAPI } from '@/services/api';

const BLUE = '#0066FF';
const DARK = '#0F172A';
const TEXT = '#1F2937';
const MUTED = '#64748B';

// ── Calendly-style SVG icons ──
const IconScheduling = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconMeetings = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <polygon points="22,8 16,12 22,16 22,8" fill="currentColor" stroke="none" />
  </svg>
);
const IconAvailability = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12,7 12,12 15,14" />
  </svg>
);
const IconContacts = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconWorkflows = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="M6 8v8" />
    <path d="M18 8v8" />
    <path d="M8 6h8" />
  </svg>
);
const IconIntegrations = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconRouting = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <circle cx="18" cy="19" r="2" />
    <path d="M6 17V9a4 4 0 0 1 4-4h6" />
    <path d="M18 7v10" />
  </svg>
);
const IconUpgrade = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12" />
    <path d="M15 9.5C15 8.12 13.66 7 12 7s-3 1.12-3 2.5S10.34 12 12 12s3 1.12 3 2.5S13.66 17 12 17s-3-1.12-3-2.5" />
  </svg>
);
const IconAnalytics = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="8" y1="17" x2="8" y2="11" />
    <line x1="12" y1="17" x2="12" y2="7" />
    <line x1="16" y1="17" x2="16" y2="14" />
  </svg>
);
const IconAdmin = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    <circle cx="19" cy="5" r="2" />
  </svg>
);
const IconHelp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);
const IconExternal = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const IconLink = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
);
const IconMoreVertical = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);
const IconInvite = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const IconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.65" y2="16.65" />
  </svg>
);

// ── Sidebar nav config ──
const NAV = [
  { id: 'scheduling', label: 'Scheduling', Icon: IconScheduling },
  { id: 'meetings', label: 'Meetings', Icon: IconMeetings },
  { id: 'availability', label: 'Availability', Icon: IconAvailability },
  { id: 'contacts', label: 'Contacts', Icon: IconContacts },
  { id: 'workflows', label: 'Workflows', Icon: IconWorkflows },
  { id: 'integrations', label: 'Integrations & apps', Icon: IconIntegrations },
  { id: 'routing', label: 'Routing', Icon: IconRouting },
];
const NAV_FOOTER = [
  { id: 'upgrade', label: 'Upgrade plan', Icon: IconUpgrade },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics },
  { id: 'admin', label: 'Admin center', Icon: IconAdmin },
  { id: 'help', label: 'Help', Icon: IconHelp },
];

const CalendarDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNav, setActiveNav] = useState('scheduling');
  const [activeTab, setActiveTab] = useState('event-types');
  const [showCalendarToast, setShowCalendarToast] = useState(false);

  // ── Create flow state ──
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [eventPanel, setEventPanel] = useState(null); // null | 'one-on-one' | 'group'
  const [eventDuration, setEventDuration] = useState('30 min');
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const [eventLocation, setEventLocation] = useState(null); // 'zoom' | 'phone' | 'in-person'
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const DEFAULT_WEEKLY = {
    Sun: [],
    Mon: [{ start: '9:00am', end: '5:00pm' }],
    Tue: [{ start: '9:00am', end: '5:00pm' }],
    Wed: [{ start: '9:00am', end: '5:00pm' }],
    Thu: [{ start: '9:00am', end: '5:00pm' }],
    Fri: [{ start: '9:00am', end: '5:00pm' }],
    Sat: [],
  };
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY);
  const [dateSpecificHours, setDateSpecificHours] = useState([]); // [{ date: '2026-05-21', ranges: [{start, end}] }]

  // Logo from /calender page content (same as the landing page header)
  const [pageContent, setPageContent] = useState(() => {
    try {
      const c = localStorage.getItem('calender_content');
      return c ? JSON.parse(c) : {};
    } catch { return {}; }
  });

  // Load current user
  useEffect(() => {
    let token = null;
    const urlToken = searchParams.get('token');
    if (urlToken) {
      try { localStorage.setItem('calender_jwt', urlToken); } catch {}
      token = urlToken;
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else {
      try { token = localStorage.getItem('calender_jwt'); } catch {}
    }

    if (!token) {
      navigate('/calender/signin', { replace: true });
      return;
    }

    axios.get('/api/calendar-users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.success) setUser(res.data.data);
        else throw new Error('Failed to load user');
      })
      .catch((err) => {
        try { localStorage.removeItem('calender_jwt'); } catch {}
        setError(err?.response?.data?.message || err.message);
        navigate('/calender/signin', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate, searchParams]);

  // Load logo/branding from the calender page (so dashboard matches the landing)
  useEffect(() => {
    pagesAPI.getOne('calender')
      .then((res) => {
        const data = res?.data?.data?.content;
        if (data) {
          setPageContent(data);
          try { localStorage.setItem('calender_content', JSON.stringify(data)); } catch {}
        }
      })
      .catch(() => { /* page not created in admin yet */ });
  }, []);

  // Calendar-connected toast
  useEffect(() => {
    if (searchParams.get('calendar') === 'connected') {
      setShowCalendarToast(true);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      const t = setTimeout(() => setShowCalendarToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const logout = () => {
    try { localStorage.removeItem('calender_jwt'); } catch {}
    navigate('/calender', { replace: true });
  };

  const connectCalendar = () => {
    let token = null;
    try { token = localStorage.getItem('calender_jwt'); } catch {}
    if (!token) return navigate('/calender/signin');
    window.location.href = `/api/auth/google/connect-calendar?token=${encodeURIComponent(token)}`;
  };

  if (loading) return <div style={loadingStyle}><div style={{ color: MUTED, fontSize: 14 }}>Loading…</div></div>;
  if (!user) return <div style={loadingStyle}><div style={{ color: '#DC2626', fontSize: 14 }}>{error || 'Not signed in'}</div></div>;

  const firstName = (user.name || user.email.split('@')[0]).split(' ')[0];
  const initials = (user.name || user.email).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  // Logo from /calender page admin (same logoImage shown on the landing page)
  const logoImage = pageContent.logoImage || '';
  const logoText = pageContent.logoText || 'ItsGoti';
  const logoFirstLetter = (logoText || 'G').trim().charAt(0).toUpperCase() || 'G';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: "'Inter', 'Gilroy', sans-serif",
      color: TEXT,
      display: 'flex',
    }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 244,
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo (matches landing page header) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingLeft: 4 }}>
          <a href="/calender" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            {logoImage ? (
              <img
                src={logoImage}
                alt={logoText || 'Logo'}
                style={{ height: 32, width: 'auto', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: BLUE, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14,
                }}>{logoFirstLetter}</div>
                <span style={{ fontSize: 19, fontWeight: 800, color: BLUE, letterSpacing: '-0.5px' }}>
                  {logoText}
                </span>
              </>
            )}
          </a>
          <button style={collapseBtn} title="Collapse">«</button>
        </div>

        {/* Create button */}
        <button style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 999,
          border: '1px solid #CBD5E1',
          background: '#fff',
          color: TEXT,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 22,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Create
        </button>

        {/* Primary nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              style={navItemStyle(activeNav === id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
          {NAV_FOOTER.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              style={navItemStyle(activeNav === id, id === 'upgrade')}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'help' && <IconChevronDown />}
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '14px 32px',
          gap: 14,
          borderBottom: '1px solid #F1F5F9',
        }}>
          <button style={iconBtn} title="Invite a user">
            <IconInvite />
          </button>
          <div style={{ position: 'relative' }}>
            <ProfileMenu user={user} initials={initials} onLogout={logout} />
          </div>
        </header>

        {/* Calendar connect banner */}
        {!user.calendarConnected && (
          <CalendarConnectBanner onConnect={connectCalendar} />
        )}

        {/* Page header */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              Scheduling
              <span style={{ color: MUTED, fontSize: 18, fontWeight: 400 }}>
                <IconHelp size={18} />
              </span>
            </h1>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowCreateMenu((v) => !v)}
                style={{
                  background: BLUE,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >+ Create <IconChevronDown /></button>
              {showCreateMenu && (
                <CreateMenu
                  onClose={() => setShowCreateMenu(false)}
                  onPick={(type) => {
                    setShowCreateMenu(false);
                    setEventPanel(type);
                    setEventDuration('30 min');
                    setEventLocation(null);
                  }}
                />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid #E5E7EB' }}>
            {[
              { id: 'event-types', label: 'Event types' },
              { id: 'links', label: 'Single-use links' },
              { id: 'polls', label: 'Meeting polls' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '12px 0',
                  fontSize: 14,
                  fontWeight: 700,
                  color: activeTab === tab.id ? DARK : MUTED,
                  borderBottom: activeTab === tab.id ? `2px solid ${DARK}` : '2px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginBottom: -1,
                }}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '24px 32px' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 420, marginBottom: 18 }}>
            <input
              placeholder="Search event types"
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                color: TEXT,
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, display: 'flex' }}>
              <IconSearch />
            </span>
          </div>

          {/* User row */}
          <div style={{
            background: '#F8FAFC',
            padding: '10px 16px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <Avatar user={user} initials={initials} size={28} />
            <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{user.name || firstName}</span>
            <a href="#" style={{ marginLeft: 'auto', fontSize: 13, color: BLUE, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <IconExternal /> View landing page
            </a>
            <button style={iconBtn}><IconMoreVertical /></button>
          </div>

          {/* Sample event type card */}
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            background: '#fff',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'stretch',
          }}>
            <div style={{ width: 5, background: '#8B5CF6' }} />
            <div style={{ flex: 1, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: DARK }}>30 Minute Meeting</span>
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                    30 min · Google Meet · One-on-One
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                    Weekdays, 9 am – 5 pm
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={pillBtn}>
                    <IconLink /> Copy link
                  </button>
                  <button style={iconBtn}><IconExternal size={16} /></button>
                  <button style={iconBtn}><IconMoreVertical /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} />
          </div>
        </div>
      </main>

      {/* New Event side panel */}
      {eventPanel && (
        <EventPanel
          eventType={eventPanel}
          onClose={() => setEventPanel(null)}
          duration={eventDuration}
          setDuration={setEventDuration}
          showDurationMenu={showDurationMenu}
          setShowDurationMenu={setShowDurationMenu}
          location={eventLocation}
          setLocation={setEventLocation}
          weeklyHours={weeklyHours}
          dateSpecificHours={dateSpecificHours}
          onEditSchedule={() => setShowScheduleEditor(true)}
          user={user}
        />
      )}

      {/* Schedule editor modal */}
      {showScheduleEditor && (
        <ScheduleEditor
          weeklyHours={weeklyHours}
          setWeeklyHours={setWeeklyHours}
          dateSpecificHours={dateSpecificHours}
          setDateSpecificHours={setDateSpecificHours}
          onClose={() => setShowScheduleEditor(false)}
          onAddHours={() => setShowDatePicker(true)}
        />
      )}

      {/* Date-specific hours picker */}
      {showDatePicker && (
        <DateSpecificPicker
          onClose={() => setShowDatePicker(false)}
          onApply={(entry) => {
            setDateSpecificHours((prev) => [...prev, entry]);
            setShowDatePicker(false);
          }}
        />
      )}

      {/* Floating chat bubble (decorative) */}
      <button style={{
        position: 'fixed', bottom: 24, right: 24,
        width: 48, height: 48, borderRadius: '50%',
        background: BLUE, color: '#fff', border: 'none',
        boxShadow: '0 6px 20px rgba(0,102,255,0.35)',
        cursor: 'pointer', fontSize: 22, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>💬</button>

      {/* Toast: calendar connected */}
      {showCalendarToast && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          right: 24,
          background: '#10B981',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span>✓</span> Google Calendar connected
        </div>
      )}
    </div>
  );
};

// ── Helpers ──

const navItemStyle = (active, highlight = false) => ({
  background: active ? '#EFF6FF' : (highlight ? '#EFF6FF' : 'transparent'),
  border: 'none',
  color: active ? BLUE : TEXT,
  padding: '9px 12px',
  borderRadius: 8,
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 14,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

const iconBtn = {
  background: 'transparent',
  border: 'none',
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: MUTED,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const collapseBtn = {
  background: 'transparent',
  border: 'none',
  color: MUTED,
  fontSize: 16,
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 4,
};

const pillBtn = {
  background: '#fff',
  border: '1px solid #CBD5E1',
  borderRadius: 999,
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: TEXT,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const loadingStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F8FAFC',
  fontFamily: "'Inter', sans-serif",
};

// ── Sub-components ──

const Avatar = ({ user, initials, size = 32 }) => (
  user.picture ? (
    <img
      src={user.picture}
      alt={user.name || user.email}
      referrerPolicy="no-referrer"
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#EC4899', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.42,
    }}>{initials}</div>
  )
);

const ProfileMenu = ({ user, initials, onLogout }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <Avatar user={user} initials={initials} size={32} />
        <span style={{ fontSize: 12, color: MUTED }}><IconChevronDown /></span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
            minWidth: 220,
            padding: 10,
            zIndex: 51,
          }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{user.name || 'User'}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                padding: '8px 10px',
                fontSize: 13,
                color: '#DC2626',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >Log out</button>
          </div>
        </>
      )}
    </>
  );
};

const CalendarConnectBanner = ({ onConnect }) => (
  <div style={{
    margin: '20px 32px 0',
    background: 'linear-gradient(90deg, #EFF6FF 0%, #FFF 100%)',
    border: '1px solid #BFDBFE',
    borderRadius: 12,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: BLUE, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, fontWeight: 800,
    }}>📅</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>
        Connect your Google Calendar
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
        Sync events both ways and prevent double-bookings automatically.
      </div>
    </div>
    <button
      onClick={onConnect}
      style={{
        background: BLUE,
        color: '#fff',
        border: 'none',
        padding: '10px 18px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', color: BLUE,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 12,
      }}>✓</span>
      Connect
    </button>
  </div>
);

// ────────────────────────────────────────────────────────────
// Create dropdown menu — shows 2 event types (One-on-one, Group)
// ────────────────────────────────────────────────────────────
const CreateMenu = ({ onClose, onPick }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
      minWidth: 360, padding: '18px 20px', zIndex: 91,
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 14 }}>Event type</div>

      <button onClick={() => onPick('one-on-one')} style={menuItemStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: BLUE, marginBottom: 4 }}>One-on-one</div>
        <div style={{ fontSize: 13, color: TEXT, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          1 host <ArrowRight /> 1 invitee
        </div>
        <div style={{ fontSize: 12, color: MUTED }}>Good for coffee chats, 1:1 interviews, etc.</div>
      </button>

      <button onClick={() => onPick('group')} style={menuItemStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: BLUE, marginBottom: 4 }}>Group</div>
        <div style={{ fontSize: 13, color: TEXT, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          1 host <ArrowRight /> Multiple invitees
        </div>
        <div style={{ fontSize: 12, color: MUTED }}>Webinars, online classes, etc.</div>
      </button>
    </div>
  </>
);
const menuItemStyle = {
  background: 'transparent', border: 'none', textAlign: 'left',
  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
  width: '100%', fontFamily: 'inherit', marginBottom: 4,
  display: 'block',
};
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </svg>
);

// ────────────────────────────────────────────────────────────
// New Event side panel (right drawer)
// ────────────────────────────────────────────────────────────
const EventPanel = ({
  eventType, onClose, duration, setDuration, showDurationMenu, setShowDurationMenu,
  location, setLocation, weeklyHours, dateSpecificHours, onEditSchedule, user,
}) => {
  const typeLabel = eventType === 'group' ? 'Group' : 'One-on-One';
  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 380, maxWidth: '100vw',
      background: '#fff', borderLeft: '1px solid #E5E7EB',
      boxShadow: '-12px 0 36px rgba(0,0,0,0.08)',
      zIndex: 200, display: 'flex', flexDirection: 'column',
    }}>
      <header style={{ padding: '18px 24px 16px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 4 }}>Event type</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, color: MUTED, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8B5CF6' }} />
          <span style={{ fontSize: 20, fontWeight: 800, color: DARK }}>New Meeting</span>
        </div>
        <div style={{ fontSize: 12, color: MUTED }}>{typeLabel}</div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 100px' }}>
        {/* Duration */}
        <Section title="Duration">
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDurationMenu((v) => !v)}
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #E2E8F0', borderRadius: 8,
                background: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                color: DARK, cursor: 'pointer', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>{duration}</span>
              <IconChevronDown />
            </button>
            {showDurationMenu && (
              <>
                <div onClick={() => setShowDurationMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 91,
                  padding: 6, fontFamily: 'inherit',
                }}>
                  {['15 min', '30 min', '45 min', '1 hr', 'Custom'].map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDuration(d); setShowDurationMenu(false); }}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '8px 12px', borderRadius: 6,
                        border: 'none', background: 'transparent',
                        fontSize: 14, color: TEXT, cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <span>{d}</span>
                      {d === duration && <span style={{ color: BLUE }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { id: 'zoom', label: 'Zoom', icon: '🎥' },
              { id: 'phone', label: 'Phone call', icon: '📞' },
              { id: 'in-person', label: 'In-person', icon: '📍' },
              { id: 'all', label: 'All options', icon: '⋯' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLocation(opt.id)}
                style={{
                  border: location === opt.id ? `1.5px solid ${BLUE}` : '1px solid #E2E8F0',
                  background: location === opt.id ? '#EFF6FF' : '#fff',
                  borderRadius: 8, padding: '12px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: DARK }}>{opt.label}</span>
              </button>
            ))}
          </div>
          {!location && (
            <div style={{
              marginTop: 10, background: '#FEF3C7', border: '1px solid #FCD34D',
              borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: '#92400E',
            }}>⚠ Add a location to help invitees know how to attend</div>
          )}
        </Section>

        {/* Availability */}
        <Section title="Availability">
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Weekdays, 9 am – 5 pm</div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', marginTop: 8,
          }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Schedule</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Working hours (default)</div>
            </div>
            <button
              onClick={onEditSchedule}
              style={{
                background: 'transparent', border: 'none', color: BLUE,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Edit</button>
          </div>
          {dateSpecificHours.length > 0 && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>
              {dateSpecificHours.length} date-specific {dateSpecificHours.length === 1 ? 'override' : 'overrides'}
            </div>
          )}
        </Section>

        {/* Host */}
        <Section title="Host">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar user={user} initials={(user.name || user.email).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()} size={28} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{user.name || user.email.split('@')[0]} (you)</div>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #F1F5F9',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff',
      }}>
        <button style={{
          background: 'transparent', border: 'none', color: BLUE,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>More options</button>
        <button style={{
          background: BLUE, color: '#fff', border: 'none',
          padding: '10px 22px', borderRadius: 999,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>Create</button>
      </footer>
    </aside>
  );
};

const Section = ({ title, children }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────
// Working Hours editor modal
// ────────────────────────────────────────────────────────────
const TIME_OPTIONS = (() => {
  const out = [];
  const fmt = (h, m) => {
    const period = h < 12 ? 'am' : 'pm';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${m.toString().padStart(2, '0')}${period}`;
  };
  for (let h = 0; h < 24; h++) for (const m of [0, 15, 30, 45]) out.push(fmt(h, m));
  return out;
})();

const DAYS = [
  { id: 'Sun', short: 'S' },
  { id: 'Mon', short: 'M' },
  { id: 'Tue', short: 'T' },
  { id: 'Wed', short: 'W' },
  { id: 'Thu', short: 'T' },
  { id: 'Fri', short: 'F' },
  { id: 'Sat', short: 'S' },
];

const ScheduleEditor = ({ weeklyHours, setWeeklyHours, dateSpecificHours, setDateSpecificHours, onClose, onAddHours }) => {
  const [view, setView] = useState('list'); // 'list' | 'calendar'

  const setDayRanges = (day, ranges) => {
    setWeeklyHours((prev) => ({ ...prev, [day]: ranges }));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,30,60,0.5)',
        zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '40px 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 980,
          boxShadow: '0 30px 80px rgba(0,0,0,0.20)', padding: 28,
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>Working hours (default)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setView('list')} style={toggleBtn(view === 'list')}>List</button>
              <button onClick={() => setView('calendar')} style={toggleBtn(view === 'calendar')}>Calendar</button>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, color: MUTED, cursor: 'pointer' }}>×</button>
          </div>
        </div>

        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 8, padding: '10px 14px', marginBottom: 18,
          fontSize: 13, color: '#1E40AF',
        }}>⓵ Updating your schedule here will update it on event types using it</div>

        {view === 'list' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Weekly hours */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: DARK }}>Weekly hours</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Set when you're typically available for meetings</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DAYS.map((day) => {
                  const ranges = weeklyHours[day.id] || [];
                  const isUnavailable = ranges.length === 0;
                  return (
                    <div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: DARK, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                      }}>{day.short}</div>

                      {isUnavailable ? (
                        <span style={{ color: MUTED, fontSize: 13, flex: 1 }}>Unavailable</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          {ranges.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <TimeSelect value={r.start} onChange={(v) => {
                                const next = [...ranges]; next[i] = { ...r, start: v };
                                setDayRanges(day.id, next);
                              }} />
                              <span style={{ color: MUTED }}>-</span>
                              <TimeSelect value={r.end} onChange={(v) => {
                                const next = [...ranges]; next[i] = { ...r, end: v };
                                setDayRanges(day.id, next);
                              }} />
                              <button
                                onClick={() => setDayRanges(day.id, ranges.filter((_, j) => j !== i))}
                                style={smallIconBtn} title="Remove">×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setDayRanges(day.id, [...ranges, { start: '9:00am', end: '5:00pm' }])}
                        style={smallIconBtn} title="Add">+</button>
                      <button
                        onClick={() => {
                          // Copy this day's hours to all weekdays
                          const newHours = { ...weeklyHours };
                          DAYS.forEach(d => { if (d.id !== day.id && d.id !== 'Sun' && d.id !== 'Sat') newHours[d.id] = [...ranges]; });
                          setWeeklyHours(newHours);
                        }}
                        style={smallIconBtn} title="Copy to weekdays">⎘</button>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, marginTop: 16, cursor: 'pointer' }}>
                Eastern Time – US &amp; Canada
              </div>
            </div>

            {/* Date-specific hours */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: DARK }}>Date-specific hours</span>
                <button
                  onClick={onAddHours}
                  style={{
                    background: '#fff', border: '1px solid #CBD5E1',
                    padding: '6px 14px', borderRadius: 999,
                    fontSize: 13, fontWeight: 700, color: TEXT,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >+ Hours</button>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Adjust hours for specific days</div>

              {dateSpecificHours.length === 0 ? (
                <div style={{ fontSize: 13, color: MUTED }}>None</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dateSpecificHours.map((entry, i) => (
                    <div key={i} style={{
                      border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{entry.dates.join(', ')}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>
                          {entry.ranges.length === 0 ? 'Unavailable' :
                            entry.ranges.map(r => `${r.start} - ${r.end}`).join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => setDateSpecificHours((prev) => prev.filter((_, j) => j !== i))}
                        style={smallIconBtn}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 14 }}>
            Calendar view — coming soon
          </div>
        )}
      </div>
    </div>
  );
};

const TimeSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6,
      fontSize: 13, fontFamily: 'inherit', background: '#fff', color: DARK,
      cursor: 'pointer', minWidth: 90,
    }}
  >
    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
  </select>
);
const smallIconBtn = {
  width: 24, height: 24, borderRadius: 6,
  border: '1px solid #E2E8F0', background: '#fff',
  cursor: 'pointer', fontSize: 14, color: MUTED, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
const toggleBtn = (active) => ({
  border: 'none', background: active ? '#F1F5F9' : 'transparent',
  color: active ? DARK : MUTED, padding: '6px 14px', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
});

// ────────────────────────────────────────────────────────────
// Date-specific hours picker (mini calendar + time range)
// ────────────────────────────────────────────────────────────
const DateSpecificPicker = ({ onClose, onApply }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState([]);
  const [start, setStart] = useState('9:00am');
  const [end, setEnd] = useState('5:00pm');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
  const headers = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateString = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const toggleDate = (d) => {
    if (!d) return;
    const s = dateString(d);
    setSelectedDates((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const apply = () => {
    if (selectedDates.length === 0) return;
    onApply({
      dates: selectedDates.map((s) => {
        const [y, m, d] = s.split('-');
        return `${new Date(y, m - 1, d).toLocaleString('default', { month: 'short' })} ${parseInt(d)}`;
      }),
      ranges: [{ start, end }],
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,30,60,0.55)',
        zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, padding: 24,
          width: '100%', maxWidth: 380,
          boxShadow: '0 30px 80px rgba(0,0,0,0.20)',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 18 }}>
          Select the date(s) you want to<br />assign specific hours
        </div>

        {/* Calendar header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
            style={navArrow}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{monthName} {year}</div>
          <button
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
            style={navArrow}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {headers.map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: MUTED, textAlign: 'center', padding: 4 }}>{h}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((d, i) => {
            if (d == null) return <div key={i} />;
            const isSelected = selectedDates.includes(dateString(d));
            return (
              <button
                key={i}
                onClick={() => toggleDate(d)}
                style={{
                  background: isSelected ? BLUE : 'transparent',
                  color: isSelected ? '#fff' : DARK,
                  border: 'none', borderRadius: 999,
                  width: 36, height: 36,
                  fontSize: 13, fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  margin: '0 auto',
                }}
              >{d}</button>
            );
          })}
        </div>

        {/* Time picker */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 8 }}>What hours are you available?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TimeSelect value={start} onChange={setStart} />
            <span style={{ color: MUTED }}>-</span>
            <TimeSelect value={end} onChange={setEnd} />
            <button style={{ ...smallIconBtn, marginLeft: 'auto' }}>+</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: TEXT,
            fontSize: 14, fontWeight: 700, padding: '8px 14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button
            onClick={apply}
            disabled={selectedDates.length === 0}
            style={{
              background: selectedDates.length === 0 ? '#CBD5E1' : BLUE,
              color: '#fff', border: 'none',
              padding: '9px 22px', borderRadius: 8,
              fontSize: 14, fontWeight: 700,
              cursor: selectedDates.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >Apply</button>
        </div>
      </div>
    </div>
  );
};
const navArrow = {
  width: 28, height: 28, borderRadius: '50%',
  background: 'transparent', border: 'none', color: DARK,
  fontSize: 18, cursor: 'pointer', fontFamily: 'inherit',
};

export default CalendarDashboard;
