import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { pagesAPI } from '@/services/api';

const BLUE = '#2558BF';
const DARK = '#0A2540';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.6 10.23c0-.65-.05-1.32-.17-1.95H10v3.68h5.41a4.63 4.63 0 0 1-2 3.04v2.5h3.22c1.89-1.74 2.97-4.3 2.97-7.27z" fill="#4285F4"/>
    <path d="M10 20c2.7 0 4.97-.89 6.62-2.42l-3.22-2.5c-.89.6-2.04.95-3.4.95-2.6 0-4.81-1.76-5.6-4.12H1.07v2.58A10 10 0 0 0 10 20z" fill="#34A853"/>
    <path d="M4.4 11.91A5.92 5.92 0 0 1 4.09 10c0-.66.11-1.3.31-1.91V5.51H1.07a10 10 0 0 0 0 8.98l3.33-2.58z" fill="#FBBC05"/>
    <path d="M10 3.97c1.47 0 2.79.51 3.83 1.5l2.86-2.86A10 10 0 0 0 10 0a10 10 0 0 0-8.93 5.51L4.4 8.1C5.19 5.74 7.4 3.97 10 3.97z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="9.5" height="9.5" fill="#F25022"/>
    <rect x="10.5" y="0" width="9.5" height="9.5" fill="#7FBA00"/>
    <rect x="0" y="10.5" width="9.5" height="9.5" fill="#00A4EF"/>
    <rect x="10.5" y="10.5" width="9.5" height="9.5" fill="#FFB900"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="6" y="2" width="12" height="20" rx="2" stroke={BLUE} strokeWidth="2"/>
    <circle cx="12" cy="18" r="1" fill={BLUE}/>
    <circle cx="18" cy="6" r="4" fill="#22C55E"/>
    <path d="M16 6l1.5 1.5L20 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke={BLUE} strokeWidth="2"/>
    <path d="M2 7l10 7 10-7" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="19" cy="7" r="4" fill="#F59E0B"/>
    <path d="M19 5v2.5l1.5 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Fallback mock 1: matches your existing "Book a Direct Call" popup design
const BookingMock = () => {
  const dates = [
    { day: 'Wed', date: '13 May', active: false },
    { day: 'Thu', date: '14 May', active: true },
    { day: 'Fri', date: '15 May', active: false },
    { day: 'Mon', date: '18 May', active: false },
  ];
  const times = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  ];
  const chev = {
    width: 22, height: 22, borderRadius: '50%',
    border: '1px solid #E2E8F0', background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, color: '#64748B', flex: '0 0 auto',
  };

  return (
    <div style={{
      display: 'flex',
      gap: 14,
      width: '100%',
      maxWidth: 760,
      filter: 'drop-shadow(0 20px 50px rgba(15,30,60,0.15))',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '22px 22px',
        flex: '0 0 38%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#FFF7E0', color: '#000',
          padding: '4px 10px 4px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 700, alignSelf: 'flex-start', marginBottom: 18,
        }}>
          <span style={{ color: '#F59E0B', fontSize: 13 }}>★</span>
          <span>5</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#000', lineHeight: '22px', marginBottom: 12 }}>
          Book a Direct Call with Our Founder's Team
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 11, marginBottom: 16 }}>
          <span style={{ fontSize: 12 }}>📅</span>
          <span>30 mins</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#000', marginBottom: 10 }}>
          Here is how we will help you:
        </div>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <div style={{
              flex: '0 0 auto', width: 18, height: 18, borderRadius: '50%',
              background: '#F59E0B', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>{n}</div>
            <div style={{ fontSize: 10, color: '#1F2937', lineHeight: '14px' }}>
              Ask questions to understand your vision &amp; challenges
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff', borderRadius: 16, padding: '22px 22px', flex: 1, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 22, height: 22, borderRadius: '50%',
          border: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#94A3B8',
        }}>×</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#000', marginBottom: 12 }}>
          When should we meet?
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <div style={chev}>‹</div>
          {dates.map((d) => (
            <div key={d.date} style={{
              flex: 1, padding: '6px 4px', borderRadius: 8,
              border: d.active ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
              background: d.active ? '#FFF7E0' : '#fff',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600 }}>{d.day}</div>
              <div style={{ fontSize: 11, color: '#000', fontWeight: 700 }}>{d.date}</div>
            </div>
          ))}
          <div style={chev}>›</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#000', marginBottom: 8 }}>
          Select time of day
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
          {times.map((t, i) => (
            <div key={t} style={{
              padding: '7px 0', borderRadius: 8,
              border: i === 0 ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
              background: i === 0 ? '#FFF7E0' : '#fff',
              fontSize: 10, fontWeight: 600, color: '#000', textAlign: 'center',
            }}>{t}</div>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#000', marginBottom: 4 }}>Timezone</div>
        <div style={{
          border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px',
          fontSize: 10, color: '#1F2937', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi</span>
          <span style={{ color: '#94A3B8' }}>▾</span>
        </div>
        <div style={{
          background: '#000', color: '#fff', padding: '11px 0',
          borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700,
        }}>Continue</div>
      </div>
    </div>
  );
};

// Fallback mock 2: reminder workflow cards
const RemindersMock = () => {
  const subCard = { background: '#F8FAFC', borderRadius: 12, padding: '16px 18px' };
  const badgeRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 };
  const badge = { background: '#DBEAFE', color: BLUE, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 };
  const subCardTitle = { fontSize: 16, fontWeight: 700, color: DARK, textAlign: 'center', marginBottom: 14 };
  const subCardChip = {
    background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
    padding: '10px 14px', fontSize: 12, fontWeight: 600, color: DARK, textAlign: 'center',
  };
  const dottedDivider = { borderLeft: '2px dotted #CBD5E1', height: 16, width: 0, margin: '0 auto' };

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 20px 60px rgba(15,30,60,0.15)',
      padding: '28px 32px', width: '100%', maxWidth: 620,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 22 }}>
        Reduce no-shows and stay on track
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={subCard}>
          <div style={badgeRow}>
            <span style={badge}>Workflow</span>
            <PhoneIcon />
          </div>
          <div style={subCardTitle}>Send text reminder</div>
          <div style={subCardChip}>24 hours before event starts</div>
          <div style={dottedDivider} />
          <div style={{ ...subCardChip, background: '#EEF2FF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: BLUE }}>✉</span> Send text to invitees
          </div>
        </div>
        <div style={subCard}>
          <div style={badgeRow}>
            <span style={badge}>Workflow</span>
            <EmailIcon />
          </div>
          <div style={subCardTitle}>Send follow-up email</div>
          <div style={subCardChip}>2 hours after event ends</div>
          <div style={dottedDivider} />
          <div style={{ ...subCardChip, background: '#EEF2FF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: BLUE }}>✉</span> Send email to invitees
          </div>
        </div>
      </div>
    </div>
  );
};

// Default fallback when admin hasn't uploaded slideshow images yet:
// auto-rotates between BookingMock and RemindersMock every 4.5 seconds.
const FallbackMockSlideshow = ({ isMobile }) => {
  const [variant, setVariant] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVariant((v) => (v + 1) % 2), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      position: 'relative', width: '100%',
      minHeight: isMobile ? 380 : 480,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: isMobile ? 'relative' : 'absolute', inset: isMobile ? 'auto' : 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 600ms ease-in-out',
        opacity: variant === 0 ? 1 : 0,
        pointerEvents: variant === 0 ? 'auto' : 'none',
      }}>
        <BookingMock />
      </div>
      <div style={{
        position: isMobile ? 'relative' : 'absolute', inset: isMobile ? 'auto' : 0,
        marginTop: isMobile ? 24 : 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 600ms ease-in-out',
        opacity: variant === 1 ? 1 : 0,
        pointerEvents: variant === 1 ? 'auto' : 'none',
      }}>
        <RemindersMock />
      </div>
    </div>
  );
};

// Slideshow on the right side. All images same size, auto-crossfades.
const ImageSlideshow = ({ images, intervalSec = 3, height }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const ms = Math.max(1, intervalSec) * 1000;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), ms);
    return () => clearInterval(t);
  }, [images, intervalSec]);

  if (!images || images.length === 0) return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 720,
      height,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 25px 60px rgba(15,30,60,0.18)',
      background: '#fff',
    }}>
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Slide ${i + 1}`}
          loading={i === 0 ? 'eager' : 'lazy'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#fff',
            transition: 'opacity 600ms ease-in-out',
            opacity: i === idx ? 1 : 0,
            pointerEvents: i === idx ? 'auto' : 'none',
          }}
        />
      ))}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
        }}>
          {images.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: i === idx ? BLUE : 'rgba(15,30,60,0.25)',
              transition: 'width 300ms',
            }} />
          ))}
        </div>
      )}
    </div>
  );
};

const CalendarLanding = () => {
  const [content, setContent] = useState(() => {
    try {
      const c = localStorage.getItem('calender_content');
      return c ? JSON.parse(c) : {};
    } catch { return {}; }
  });
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const location = useLocation();
  const navigate = useNavigate();

  // Determine view from URL: /calender → landing, /calender/signup → signup, /calender/signin → signin
  const pathView =
    location.pathname === '/calender/signup' ? 'signup'
    : location.pathname === '/calender/signin' ? 'signin'
    : 'landing';

  // Editor mode uses an internal view state (controlled by selected section postMessages)
  // Non-editor mode uses URL-driven view
  const [editorView, setEditorView] = useState('landing');
  const view = isEditorMode ? editorView : pathView;
  const setView = isEditorMode ? setEditorView : (next) => {
    if (next === 'signup') navigate('/calender/signup');
    else if (next === 'signin') navigate('/calender/signin');
    else navigate('/calender');
  };

  useEffect(() => {
    // Skip API fetch in editor mode — parent will push live data via postMessage
    if (isEditorMode) return;
    pagesAPI.getOne('calender')
      .then((res) => {
        const data = res?.data?.data?.content;
        if (data) {
          setContent(data);
          try { localStorage.setItem('calender_content', JSON.stringify(data)); } catch {}
        }
      })
      .catch(() => { /* page not created yet in admin — silent fallback */ });
  }, [isEditorMode]);

  // Capture ?token=... from a Google OAuth redirect, save it, and clean the URL
  useEffect(() => {
    if (isEditorMode) return;
    const token = searchParams.get('token');
    if (token) {
      try { localStorage.setItem('calender_jwt', token); } catch {}
      // Strip the token from the URL so it doesn't sit in history
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [isEditorMode]); // eslint-disable-line

  // Trigger Google OAuth — full-page redirect to backend, which redirects to Google
  const startGoogleAuth = () => {
    window.location.href = '/api/auth/google';
  };

  // ── Multi-step signup state ──
  // 'email'    → email input + Continue (initial step)
  // 'choose'   → "Hi email" + Sign up with Google + Click here for password
  // 'password' → email + name + password form
  const [signupStep, setSignupStep] = useState('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // ── Multi-step signin state ──
  // 'email'    → email input + Continue
  // 'password' → password input (if account has password)
  // 'no-account' → modal "account doesn't exist"
  const [signinStep, setSigninStep] = useState('email');
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError] = useState('');
  const [signinLoading, setSigninLoading] = useState(false);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Continue clicked on signup email step → check if user exists, show next step
  const handleSignupContinueEmail = async () => {
    setSignupError('');
    const email = signupEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setSignupError('Please enter a valid email');
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/email/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then((r) => r.json());
      if (res?.exists && res.hasPassword) {
        // Already has a password — bounce them to signin
        setSigninEmail(email);
        setView('signin');
        setSigninStep('password');
        return;
      }
      setSignupStep('choose');
    } catch {
      setSignupError('Network error. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Continue clicked on signup password form → submit
  const handleSignupSubmit = async () => {
    setSignupError('');
    if (!validateEmail(signupEmail)) return setSignupError('Invalid email');
    if (signupName.trim().length < 2) return setSignupError('Please enter your full name');
    if (signupPassword.length < 12) return setSignupError('Password must be at least 12 characters');
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/email/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, name: signupName, password: signupPassword }),
      }).then((r) => r.json());
      if (res?.success && res.token) {
        try { localStorage.setItem('calender_jwt', res.token); } catch {}
        navigate('/calender/dashboard', { replace: true });
      } else {
        setSignupError(res?.message || 'Sign up failed');
      }
    } catch {
      setSignupError('Network error. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Continue clicked on signin email step → check account, show password OR no-account modal
  const handleSigninContinueEmail = async () => {
    setSigninError('');
    const email = signinEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setSigninError('Please enter a valid email');
      return;
    }
    setSigninLoading(true);
    try {
      const res = await fetch('/api/auth/email/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then((r) => r.json());
      if (!res?.exists) {
        setShowNoAccountModal(true);
        return;
      }
      if (res.hasPassword) {
        setSigninStep('password');
      } else if (res.hasGoogle) {
        // Account exists but only Google — kick to Google OAuth
        startGoogleAuth();
      } else {
        setShowNoAccountModal(true);
      }
    } catch {
      setSigninError('Network error. Please try again.');
    } finally {
      setSigninLoading(false);
    }
  };

  // Submit signin password
  const handleSigninSubmit = async () => {
    setSigninError('');
    if (!signinPassword) return setSigninError('Password is required');
    setSigninLoading(true);
    try {
      const res = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      }).then((r) => r.json());
      if (res?.success && res.token) {
        try { localStorage.setItem('calender_jwt', res.token); } catch {}
        navigate('/calender/dashboard', { replace: true });
      } else {
        setSigninError(res?.message || 'Invalid email or password');
      }
    } catch {
      setSigninError('Network error. Please try again.');
    } finally {
      setSigninLoading(false);
    }
  };

  // Editor mode: listen for live updates from the parent admin iframe
  useEffect(() => {
    if (!isEditorMode) return;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'EDITOR_UPDATE' || event.data?.type === 'EDITOR_INIT') {
        if (event.data.payload?.data) {
          setContent((prev) => ({ ...prev, ...event.data.payload.data }));
        }
        // Auto-switch preview based on the section the admin is editing
        const section = event.data.payload?.section;
        if (section === 'signupForm' || section === 'signupFeatures') {
          setEditorView('signup');
        } else if (section === 'signinPage') {
          setEditorView('signin');
        } else if (section) {
          setEditorView('landing');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    try {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);
    } catch (_) {}

    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = windowWidth < 900;

  const logoImage = content.logoImage || '';
  const logoText = content.logoText || 'ItsGoti';
  const loginButtonText = content.loginButtonText || 'Log In';
  const getStartedButtonText = content.getStartedButtonText || 'Get started for free';
  const heroTitle = content.heroTitle || 'Easy\nscheduling\nahead';
  const heroDescription = content.heroDescription || 'Join thousands of professionals who easily book meetings with ItsGoti — the simplest scheduling tool for your team.';
  const googleButtonText = content.googleButtonText || 'Sign up with Google';
  const microsoftButtonText = content.microsoftButtonText || 'Sign up with Microsoft';
  const emailLinkText = content.emailLinkText || 'Sign up free with email';
  const slideshowImages = Array.isArray(content.slideshowImages) ? content.slideshowImages.filter(Boolean) : [];
  const slideshowInterval = parseFloat(content.slideshowInterval) || 3;

  // Signup view fields
  const signupTitle = content.signupTitle || 'Create your free account';
  const signupSubtitle = content.signupSubtitle || 'No credit card required. Upgrade anytime.';
  const signupEmailPlaceholder = content.signupEmailPlaceholder || 'Enter your email';
  const signupContinueEmailText = content.signupContinueEmailText || 'Continue with email';
  const signupGoogleText = content.signupGoogleText || 'Continue with Google';
  const signupFooterText = content.signupFooterText || 'Continue with Apple or Microsoft to connect your calendar.';
  const signupLoginPromptText = content.signupLoginPromptText || 'Already have an account?';
  const signupLoginLinkText = content.signupLoginLinkText || 'Log In →';
  const signupBadgeText = content.signupBadgeText || 'Try Teams plan free';
  const signupFeaturesTitle = content.signupFeaturesTitle || 'Explore premium features with your free 14-day Teams plan trial';
  const signupFeaturesList = (content.signupFeaturesList || '')
    .split('\n').map((s) => s.trim()).filter(Boolean);
  const signupJoinText = content.signupJoinText || 'Join leading companies using the #1 scheduling tool';
  const signupCompanyLogos = Array.isArray(content.signupCompanyLogos)
    ? content.signupCompanyLogos.filter(Boolean) : [];

  // Signin view fields
  const signinTitle = content.signinTitle || 'Log in to your account';
  const signinEmailPlaceholder = content.signinEmailPlaceholder || 'Enter your email';
  const signinContinueButtonText = content.signinContinueButtonText || 'Continue';
  const signinGoogleText = content.signinGoogleText || 'Continue with Google';
  const signinSignupPromptText = content.signinSignupPromptText || "Don't have an account?";
  const signinSignupLinkText = content.signinSignupLinkText || 'Sign up for free →';

  const firstLetter = (logoText || 'G').trim().charAt(0).toUpperCase() || 'G';

  const LogoBlock = (
    <a
      href="/calender"
      onClick={(e) => { e.preventDefault(); setView('landing'); }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
    >
      {logoImage ? (
        <img
          src={logoImage}
          alt={logoText || 'Logo'}
          style={{ height: isMobile ? 32 : 40, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: BLUE, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18,
          }}>{firstLetter}</div>
          <span style={{ fontSize: 22, fontWeight: 800, color: BLUE, letterSpacing: '-0.5px' }}>
            {logoText}
          </span>
        </>
      )}
    </a>
  );

  // Both buttons: white background, black text (per latest design)
  const topBtnStyle = {
    background: '#fff',
    border: '1px solid #CBD5E1',
    color: DARK,
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
  const TopNavButtons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {view !== 'signin' && (
        <button onClick={() => setView('signin')} style={topBtnStyle}>
          {loginButtonText}
        </button>
      )}
      {view !== 'signup' && (
        <button onClick={() => setView('signup')} style={topBtnStyle}>
          {getStartedButtonText}
        </button>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: "'Inter', 'Gilroy', sans-serif",
      color: DARK,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <header style={{
        padding: isMobile ? '20px 24px' : '24px 56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
      }}>
        {LogoBlock}
        {TopNavButtons}
      </header>

      {!isMobile && (
        <>
          <div style={{
            position: 'absolute', top: -120, right: -120,
            width: 520, height: 520, borderRadius: '50%',
            background: BLUE, opacity: 0.95, zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', top: 80, right: 120,
            width: 220, height: 220, borderRadius: '50%',
            background: '#1E3A8A', opacity: 0.85, zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', bottom: -80, right: 60,
            width: 360, height: 220,
            background: '#D946EF',
            clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
            opacity: 0.9, zIndex: 0,
          }} />
        </>
      )}

      {view === 'signin' ? (
        // SIGNIN VIEW — Calendly-style "Log in to your account"
        <main style={{
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '20px 24px 60px' : '40px 56px 80px',
          maxWidth: 1280,
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: isMobile ? 32 : 44,
            fontWeight: 800,
            color: DARK,
            margin: '40px 0 36px',
            letterSpacing: '-1.5px',
          }}>{signinTitle}</h2>

          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: isMobile ? '32px 24px' : '40px 48px',
            boxShadow: '0 8px 30px rgba(15,30,60,0.08)',
            maxWidth: 480,
            margin: '0 auto',
            textAlign: 'left',
            border: '1px solid #F1F5F9',
          }}>
            {/* Email input always shown */}
            <input
              type="email"
              placeholder={signinEmailPlaceholder}
              value={signinEmail}
              onChange={(e) => setSigninEmail(e.target.value)}
              disabled={signinStep === 'password'}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                marginBottom: 12,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                background: signinStep === 'password' ? '#F8FAFC' : '#fff',
              }}
            />

            {/* Password input only on step 2 */}
            {signinStep === 'password' && (
              <input
                type="password"
                placeholder="Enter your password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSigninSubmit(); }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: 15,
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  marginBottom: 12,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {signinError && (
              <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{signinError}</div>
            )}

            <button
              onClick={signinStep === 'password' ? handleSigninSubmit : handleSigninContinueEmail}
              disabled={signinLoading}
              style={{
                width: '100%',
                background: BLUE,
                color: '#fff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: signinLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                marginBottom: 18,
                opacity: signinLoading ? 0.7 : 1,
              }}
            >
              {signinLoading ? 'Please wait…' : (signinStep === 'password' ? 'Log in' : signinContinueButtonText)}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 18px' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>

            <button
              onClick={startGoogleAuth}
              style={{
                width: '100%',
                background: '#fff',
                color: DARK,
                border: '1px solid #CBD5E1',
                padding: '13px 20px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <GoogleIcon />
              <span>{signinGoogleText}</span>
            </button>
          </div>

          <div style={{ fontSize: 15, color: '#64748B', marginTop: 32 }}>
            {signinSignupPromptText}{' '}
            <a
              href="/calender/signup"
              onClick={(e) => { e.preventDefault(); setView('signup'); }}
              style={{ color: BLUE, fontWeight: 700, textDecoration: 'none' }}
            >
              {signinSignupLinkText}
            </a>
          </div>
        </main>
      ) : view === 'landing' ? (
        <main style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 40 : 60,
          padding: isMobile ? '20px 24px 80px' : '40px 56px 80px',
          maxWidth: 1440,
          margin: '0 auto',
        }}>
          {/* LEFT — hero copy + CTAs */}
          <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '42%' }}>
            <h1 style={{
              fontSize: isMobile ? 48 : 80,
              lineHeight: isMobile ? '52px' : '84px',
              fontWeight: 800,
              color: DARK,
              margin: 0,
              letterSpacing: '-2px',
              whiteSpace: 'pre-line',
            }}>{heroTitle}</h1>

            <p style={{
              fontSize: isMobile ? 16 : 18,
              color: '#475569',
              lineHeight: '28px',
              margin: '24px 0 32px',
              maxWidth: 420,
            }}>{heroDescription}</p>

            <button
              onClick={startGoogleAuth}
              style={{ ...primaryBtn, background: '#fff', color: DARK, border: '1px solid #E2E8F0' }}
            >
              <GoogleIcon />
              <span>{googleButtonText}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px', maxWidth: 360 }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>

            <div style={{ fontSize: 14, color: '#64748B' }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setView('signup'); }}
                style={{ color: BLUE, fontWeight: 600, textDecoration: 'underline' }}
              >
                {emailLinkText}
              </a>
              <span style={{ marginLeft: 8 }}>·  No credit card required</span>
            </div>
          </div>

          {/* RIGHT — image slideshow */}
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {slideshowImages.length > 0 ? (
              <ImageSlideshow
                images={slideshowImages}
                intervalSec={slideshowInterval}
                height={isMobile ? 320 : 500}
              />
            ) : (
              <FallbackMockSlideshow isMobile={isMobile} />
            )}
          </div>
        </main>
      ) : (
        // SIGNUP VIEW — 3 steps: email → choose → password
        <main style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 32 : 0,
          padding: isMobile ? '20px 24px 80px' : '40px 56px 80px',
          maxWidth: 1280,
          margin: '0 auto',
        }}>
          {/* LEFT — Multi-step signup form */}
          <div style={{
            flex: 1,
            background: '#fff',
            padding: isMobile ? '0' : '20px 80px 40px 20px',
          }}>
            <h2 style={{
              fontSize: isMobile ? 28 : 36,
              fontWeight: 800,
              color: DARK,
              margin: 0,
              letterSpacing: '-1px',
            }}>
              {signupStep === 'password' ? 'Sign up for free' :
               signupStep === 'choose'   ? `Hi ${signupEmail}!` :
               signupTitle}
            </h2>
            {signupStep === 'email' && (
              <p style={{ fontSize: 14, color: '#64748B', margin: '8px 0 28px' }}>{signupSubtitle}</p>
            )}
            {signupStep === 'choose' && (
              <p style={{ fontSize: 14, color: '#64748B', margin: '8px 0 28px', maxWidth: 400 }}>
                The easiest way for you to sign up is with Google. This will automatically connect your calendar so you can start using ItsGoti right away!
              </p>
            )}
            {signupStep === 'password' && (
              <p style={{ fontSize: 14, color: '#64748B', margin: '8px 0 28px' }}>
                Create your account with email and password.
              </p>
            )}

            {/* STEP 1 — email input */}
            {signupStep === 'email' && (
              <>
                <input
                  type="email"
                  placeholder={signupEmailPlaceholder}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSignupContinueEmail(); }}
                  style={inputStyle}
                />
                {signupError && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{signupError}</div>}
                <button
                  onClick={handleSignupContinueEmail}
                  disabled={signupLoading}
                  style={{ ...primaryBtn, background: BLUE, color: '#fff', border: 'none', maxWidth: 400, opacity: signupLoading ? 0.7 : 1 }}
                >
                  {signupLoading ? 'Please wait…' : signupContinueEmailText}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', maxWidth: 400 }}>
                  <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                  <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                </div>
                <button
                  onClick={startGoogleAuth}
                  style={{ ...primaryBtn, background: '#fff', color: DARK, border: '1px solid #CBD5E1', maxWidth: 400 }}
                >
                  <GoogleIcon />
                  <span>{signupGoogleText}</span>
                </button>
                <p style={{ fontSize: 12, color: '#94A3B8', maxWidth: 400, marginTop: 14, lineHeight: '18px' }}>
                  {signupFooterText}
                </p>
              </>
            )}

            {/* STEP 2 — choose method (Google vs password) */}
            {signupStep === 'choose' && (
              <>
                <button
                  onClick={startGoogleAuth}
                  style={{ ...primaryBtn, background: BLUE, color: '#fff', border: 'none', maxWidth: 400 }}
                >
                  <GoogleIcon />
                  <span>Sign up with Google</span>
                </button>
                <div style={{ fontSize: 14, color: '#64748B', marginTop: 22, maxWidth: 400 }}>
                  Prefer to create an account with a password?{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSignupStep('password'); }}
                    style={{ color: BLUE, fontWeight: 700, textDecoration: 'none' }}
                  >
                    Click here
                  </a>
                </div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 24 }}>
                  Wrong email?{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSignupStep('email'); }}
                    style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}
                  >
                    Change
                  </a>
                </div>
              </>
            )}

            {/* STEP 3 — password form */}
            {signupStep === 'password' && (
              <>
                <label style={labelStyle}>Enter your email to get started.</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={inputStyle}
                />
                <label style={labelStyle}>Enter your full name.</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={inputStyle}
                />
                <label style={labelStyle}>Choose a password with at least 12 characters.</label>
                <input
                  type="password"
                  placeholder="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSignupSubmit(); }}
                  style={inputStyle}
                />
                <ul style={{ fontSize: 12, color: '#F59E0B', paddingLeft: 18, margin: '4px 0 14px' }}>
                  <li>Use a few words, avoid common phrases</li>
                  <li>No need for symbols, digits, or uppercase letters</li>
                </ul>
                {signupError && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{signupError}</div>}
                <button
                  onClick={handleSignupSubmit}
                  disabled={signupLoading}
                  style={{ ...primaryBtn, background: BLUE, color: '#fff', border: 'none', maxWidth: 400, opacity: signupLoading ? 0.7 : 1 }}
                >
                  {signupLoading ? 'Creating account…' : 'Continue'}
                </button>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 16 }}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSignupStep('choose'); }}
                    style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}
                  >
                    ← Back
                  </a>
                </div>
              </>
            )}

            <div style={{ fontSize: 14, color: '#64748B', marginTop: 24 }}>
              {signupLoginPromptText}{' '}
              <a
                href="/calender/signin"
                onClick={(e) => { e.preventDefault(); setView('signin'); }}
                style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}
              >
                {signupLoginLinkText}
              </a>
            </div>
          </div>

          {/* RIGHT — Trial features card (only on email step) */}
          {signupStep === 'email' && (
          <div style={{
            flex: 1,
            background: '#F1F5F9',
            borderRadius: 16,
            padding: isMobile ? '24px 20px' : '40px 48px',
          }}>
            <div style={{
              display: 'inline-block',
              background: '#DBEAFE',
              color: BLUE,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 18,
            }}>{signupBadgeText}</div>

            <h3 style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              color: DARK,
              margin: '0 0 24px',
              lineHeight: '32px',
            }}>{signupFeaturesTitle}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              {signupFeaturesList.map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flex: '0 0 auto', marginTop: 2 }}>
                    <path d="M5 12l5 5L20 7" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14, color: DARK, lineHeight: '22px' }}>{feature}</span>
                </div>
              ))}
            </div>

            {signupJoinText && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14, fontWeight: 500 }}>
                  {signupJoinText}
                </div>
                {signupCompanyLogos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 28, opacity: 0.6 }}>
                    {signupCompanyLogos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Company ${i + 1}`}
                        style={{ height: 22, width: 'auto', objectFit: 'contain', filter: 'grayscale(1)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </main>
      )}

      {/* "Account doesn't exist" modal — shown when signin email isn't registered */}
      {showNoAccountModal && (
        <div
          onClick={() => setShowNoAccountModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,30,60,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '36px 40px',
              maxWidth: 540,
              width: '100%',
              position: 'relative',
              boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
            }}
          >
            <button
              onClick={() => setShowNoAccountModal(false)}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'transparent', border: 'none',
                fontSize: 22, color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >×</button>
            <div style={{ color: '#DC2626', fontSize: 13, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
              ⓘ An account doesn't exist for {signinEmail}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: DARK, textAlign: 'center', marginBottom: 14 }}>
              Sign up with your Google account
            </div>
            <div style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: '22px' }}>
              Your email is eligible to sign up with Google for an easier setup, so you can connect your calendar instantly.
            </div>
            <button
              onClick={() => { setShowNoAccountModal(false); startGoogleAuth(); }}
              style={{
                width: '100%', background: BLUE, color: '#fff', border: 'none',
                padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowNoAccountModal(false);
                setSignupEmail(signinEmail);
                setSignupStep('password');
                setView('signup');
              }}
              style={{
                display: 'block', textAlign: 'center',
                color: BLUE, fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Create account with a password →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  maxWidth: 400,
  padding: '12px 14px',
  fontSize: 15,
  border: '1px solid #CBD5E1',
  borderRadius: 8,
  marginBottom: 12,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#0A2540',
  marginBottom: 6,
  marginTop: 4,
};

const primaryBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  width: '100%',
  maxWidth: 360,
  padding: '14px 20px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  marginBottom: 12,
  fontFamily: 'inherit',
};

export default CalendarLanding;
