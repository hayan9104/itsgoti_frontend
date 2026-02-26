import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/admin');
    } catch (err) {
      // Show user-friendly error message
      const serverMessage = err.response?.data?.message;
      if (serverMessage === 'Invalid credentials' || err.response?.status === 401) {
        setError('Email or password is invalid');
      } else {
        setError(serverMessage || 'Email or password is invalid');
      }
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F0F0F 0%, #1a1a2e 50%, #2558BF 100%)',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      padding: '20px',
    },
    card: {
      maxWidth: '420px',
      width: '100%',
      background: '#FFFFFF',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '48px 40px',
    },
    logo: {
      textAlign: 'center',
      marginBottom: '32px',
    },
    logoText: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#2558BF',
      letterSpacing: '-0.5px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      textAlign: 'center',
      color: '#0F0F0F',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      textAlign: 'center',
      color: '#6B7280',
      marginBottom: '32px',
    },
    errorBox: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      padding: '14px 16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    errorText: {
      color: '#DC2626',
      fontSize: '14px',
      fontWeight: '500',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#0F0F0F',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      border: '1.5px solid #E5E7EB',
      borderRadius: '12px',
      fontSize: '15px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#2558BF',
      boxShadow: '0 0 0 3px rgba(37, 88, 191, 0.1)',
    },
    inputError: {
      borderColor: '#DC2626',
    },
    fieldError: {
      color: '#DC2626',
      fontSize: '13px',
      marginTop: '6px',
      fontWeight: '500',
    },
    button: {
      width: '100%',
      padding: '16px',
      background: '#2558BF',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '8px',
    },
    buttonHover: {
      background: '#1e4a9e',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(37, 88, 191, 0.4)',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    footer: {
      textAlign: 'center',
      marginTop: '32px',
      paddingTop: '24px',
      borderTop: '1px solid #E5E7EB',
    },
    footerText: {
      fontSize: '13px',
      color: '#9CA3AF',
    },
    passwordWrapper: {
      position: 'relative',
      width: '100%',
    },
    passwordInput: {
      width: '100%',
      padding: '14px 48px 14px 16px',
      border: '1.5px solid #E5E7EB',
      borderRadius: '12px',
      fontSize: '15px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
    },
    eyeButton: {
      position: 'absolute',
      right: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9CA3AF',
      transition: 'color 0.2s ease',
    },
  };

  const [focusedField, setFocusedField] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoText}>It's Goti</span>
        </div>

        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to access the admin dashboard</p>

        {error && (
          <div style={styles.errorBox}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              {...register('email', { required: 'Email is required' })}
              style={{
                ...styles.input,
                ...(focusedField === 'email' ? styles.inputFocus : {}),
                ...(errors.email ? styles.inputError : {}),
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.email && (
              <p style={styles.fieldError}>{errors.email.message}</p>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password', { required: 'Password is required' })}
                style={{
                  ...styles.passwordInput,
                  ...(focusedField === 'password' ? styles.inputFocus : {}),
                  ...(errors.password ? styles.inputError : {}),
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p style={styles.fieldError}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.button,
              ...(isHovered && !isSubmitting ? styles.buttonHover : {}),
              ...(isSubmitting ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>Goti Creative Agency Admin Panel</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
