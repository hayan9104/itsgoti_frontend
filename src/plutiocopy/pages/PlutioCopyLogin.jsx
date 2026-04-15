import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';

const PlutioCopyLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = usePlutioCopyAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/plutiocopy/home');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0533 0%, #2d0a6b 40%, #4c1d95 70%, #6d28d9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '20px',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-100px', right: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'rgba(109,40,217,0.3)', filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-80px', left: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'rgba(167,139,250,0.2)', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '44px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M4 6h4v4H4zm0 5h4v4H4zm0 5h4v4H4zm5-10h4v4H9zm0 5h4v4H9zm0 5h4v4H9zm5-10h4v4h-4zm0 5h4v4h-4zm0 5h4v4h-4z" />
              </svg>
            </div>
            <span style={{
              fontSize: '22px', fontWeight: '700', color: '#1f2937',
              letterSpacing: '-0.5px',
            }}>PlutioCopy</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Sign in to your workspace
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '8px', padding: '10px 14px',
            color: '#dc2626', fontSize: '13px', marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '500',
              color: '#374151', marginBottom: '6px',
            }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: '14px', color: '#1f2937', outline: 'none',
                boxSizing: 'border-box', background: '#f9fafb',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6d28d9'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '500',
              color: '#374151', marginBottom: '6px',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '10px 40px 10px 14px',
                  border: '1.5px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '14px', color: '#1f2937', outline: 'none',
                  boxSizing: 'border-box', background: '#f9fafb',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6d28d9'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '0',
                  color: '#9ca3af',
                }}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#a78bfa' : 'linear-gradient(135deg, #6d28d9, #4f46e5)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              letterSpacing: '0.2px',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: '13px', color: '#9ca3af',
          marginTop: '20px', marginBottom: 0,
        }}>
          Don&apos;t have an account?{' '}
          <span style={{ color: '#6d28d9', cursor: 'pointer', fontWeight: '500' }}>
            Sign up free
          </span>
        </p>
      </div>
    </div>
  );
};

export default PlutioCopyLogin;
