import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useTeamAuth } from '../TeamAuthContext';
import { getPalette, baseFont, serifFont, monoFont, ensureFontsLoaded } from '../theme';
import '../team-mobile.css';

export default function TeamLogin() {
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useTeamAuth();
  const palette = getPalette(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    if (user) navigate('/team/dashboard', { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email.trim(), password);
    setSubmitting(false);
    if (res.success) navigate('/team/dashboard', { replace: true });
    else setError(res.message || 'Login failed');
  };

  if (authLoading) {
    return <div style={{ minHeight: '100vh', backgroundColor: palette.bg }} />;
  }

  return (
    <div
      className="team-login-grid"
      style={{
        minHeight: '100vh',
        backgroundColor: palette.bg,
        fontFamily: baseFont,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Left — form */}
      <div className="team-login-form" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 56px', minHeight: '100vh' }}>
        <img
          src="/Goti%20Logo%20Black.png"
          alt="Goti"
          style={{ height: 22, width: 'auto', display: 'block', alignSelf: 'flex-start' }}
        />

        <div style={{ maxWidth: 380, width: '100%', marginInline: 'auto' }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>TEAM PORTAL</div>
          <h1
            style={{
              fontFamily: serifFont,
              fontSize: 44,
              fontWeight: 400,
              color: palette.text,
              letterSpacing: '-0.02em',
              margin: 0,
              marginTop: 6,
              lineHeight: 1.05,
            }}
          >
            Welcome <em style={{ fontStyle: 'italic', fontWeight: 300 }}>back</em>
          </h1>
          <p style={{ fontFamily: baseFont, fontSize: 14, color: palette.textDim, marginTop: 14, lineHeight: 1.5 }}>
            Sign in with the email and password your admin gave you. Accounts are provisioned — you cannot sign up here.
          </p>

          <form onSubmit={onSubmit} style={{ marginTop: 32 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 6 }}>
                Work email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: palette.textMute }} />
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@itsgoti.in"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: 10,
                    backgroundColor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    color: palette.text,
                    fontFamily: baseFont,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: 12, color: palette.textMute }} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: 10,
                    backgroundColor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    color: palette.text,
                    fontFamily: baseFont,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: palette.dangerBg,
                  color: palette.danger,
                  fontFamily: baseFont,
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: palette.accent,
                color: palette.accentText,
                border: 'none',
                fontFamily: baseFont,
                fontSize: 14,
                fontWeight: 500,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: submitting ? 0.75 : 1,
              }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textMute, marginTop: 20, lineHeight: 1.6 }}>
            Trouble signing in? Ask your admin to reset your password.
          </div>
        </div>

        <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.06em' }}>
          ITSGOTI · INTERNAL TEAM TOOL
        </div>
      </div>

      {/* Right — quiet brand panel (hidden on mobile via team-login-aside) */}
      <div
        className="team-login-aside"
        style={{
          backgroundColor: palette.surfaceAlt,
          borderLeft: `1px solid ${palette.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>WHAT'S INSIDE</div>
          <h2
            style={{
              fontFamily: serifFont,
              fontSize: 36,
              fontWeight: 400,
              color: palette.text,
              letterSpacing: '-0.02em',
              margin: 0,
              marginTop: 10,
              lineHeight: 1.15,
            }}
          >
            One <em style={{ fontStyle: 'italic', fontWeight: 300 }}>clean</em> place for the team to track time, tasks, and time off.
          </h2>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'Start day · Break · AFK · End day', sub: 'A live clock that admins can see at a glance.' },
              { label: 'Tasks with priority and estimates', sub: 'Assign in seconds. Track spent time against estimates.' },
              { label: 'Leaves with one-click approval', sub: 'Apply, approve, reject — all in one calendar.' },
              { label: 'Reports that read themselves', sub: 'Per-person hours, late starts, weekly trends.' },
            ].map((item) => (
              <div key={item.label} style={{ paddingTop: 14, borderTop: `1px solid ${palette.border}` }}>
                <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 4 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
