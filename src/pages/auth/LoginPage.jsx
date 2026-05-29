import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginWithUsername, getAuthErrorMessage, setupRecaptcha, sendPhoneOtp, verifyPhoneOtpForLogin } from '../../firebase/auth';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import { UtensilsCrossed, CheckCircle2, Shield, Zap, Sparkles, Phone, User } from 'lucide-react';
import { gsap } from 'gsap';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('username'); // 'username' | 'phone'
  
  // Username state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { isAuthenticated, restaurant } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && restaurant) {
      if (restaurant.onboardingComplete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, restaurant, navigate]);

  // GSAP Entrance Animations
  useEffect(() => {
    gsap.fromTo(
      '.login-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
    gsap.fromTo(
      '.login-hero-content > *',
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  // Initialize Recaptcha for Phone Login
  useEffect(() => {
    if (loginMethod === 'phone') {
      const timer = setTimeout(() => {
        setupRecaptcha('login-recaptcha');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loginMethod]);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (err) {
          console.warn('Error clearing recaptcha verifier:', err);
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const validate = () => {
    const tempErrors = {};
    if (!username.trim()) {
      tempErrors.username = 'Username is required.';
    }
    if (!password) {
      tempErrors.password = 'Password is required.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await loginWithUsername({ username, password });
      showToast('Logged in successfully!', 'success');
    } catch (err) {
      console.error('Login error:', err);
      const userFriendlyMsg = getAuthErrorMessage(err);
      showToast(userFriendlyMsg, 'error');
      setErrors({ form: userFriendlyMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    let phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      phoneDigits = phoneDigits.slice(2);
    }
    if (phoneDigits.length !== 10) {
      setErrors({ phone: 'Enter a valid 10-digit number.' });
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = `+91${phoneDigits}`;
      
      const confResult = await sendPhoneOtp(formattedPhone);
      setConfirmationResult(confResult);
      setIsOtpSent(true);
      showToast('Verification code sent!', 'info');
      setErrors({});
    } catch (err) {
      console.error('Send OTP error:', err);
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrors({ otp: 'Please enter a valid 6-digit code.' });
      return;
    }
    
    setLoading(true);
    try {
      await verifyPhoneOtpForLogin(confirmationResult, otp);
      showToast('Logged in successfully!', 'success');
      // Redirect handled by onAuthStateChanged in useEffect
    } catch (err) {
      console.error('Verify OTP error:', err);
      showToast(getAuthErrorMessage(err), 'error');
      setErrors({ otp: getAuthErrorMessage(err) });
      if (err.message === 'NO_ACCOUNT_FOUND') {
        setIsOtpSent(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ═══ Left Panel — Dark Branding (Desktop ≥ 768px) ═══ */}
      <div
        className="login-left-panel"
        style={{
          width: '50vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '48px',
        }}
      >
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '384px', height: '384px', background: 'rgba(249,115,22,0.10)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '384px', height: '384px', background: 'rgba(234,88,12,0.10)', borderRadius: '50%', filter: 'blur(80px)' }} />

        <div className="login-hero-content" style={{ maxWidth: '480px', position: 'relative', zIndex: 10, color: '#fff' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ padding: '10px', backgroundColor: '#F97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              <UtensilsCrossed style={{ width: '24px', height: '24px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QRDine
            </span>
          </div>

          {/* Tagline Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(249,115,22,0.2)', color: '#F97316', marginBottom: '16px', border: '1px solid rgba(249,115,22,0.3)' }}>
            <Sparkles style={{ width: '12px', height: '12px' }} /> Built for local restaurants
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            QR ordering for small Indian restaurants.
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '17px', lineHeight: 1.6, marginBottom: '36px' }}>
            Owners can sign in with a simple username or verified phone number. Customers scan, order, and request bills without installing an app.
          </p>

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: CheckCircle2, title: 'Real-Time Kitchen Feed', desc: 'Instantly receive orders on your dashboard as customers add them.' },
              { icon: Zap, title: 'Menu Builder', desc: 'Update items, categories, and stock availability instantly.' },
              { icon: Shield, title: 'Zero App Downloads', desc: 'Customers scan, order, and pay without installing anything.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ marginTop: '4px', padding: '4px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', color: '#F97316', flexShrink: 0 }}>
                  <Icon style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: '#fff', fontSize: '14px', marginBottom: '2px' }}>{title}</h4>
                  <p style={{ fontSize: '13px', color: '#94A3B8' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '48px', fontSize: '13px', color: '#64748B' }}>
            &copy; {new Date().getFullYear()} QRDine. All rights reserved.
          </div>
        </div>
      </div>

      {/* ═══ Right Panel — Form (Always visible) ═══ */}
      <div
        className="login-right-panel"
        style={{
          width: '50vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--color-base-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div className="login-card" style={{ opacity: 0 }}>
          {/* Mobile Logo (shown only < 768px via CSS) */}
          <div className="login-mobile-logo" style={{ display: 'none', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <div style={{ padding: '8px', backgroundColor: '#F97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UtensilsCrossed style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#F97316' }}>
              QRDine
            </span>
          </div>

          {/* Form Card */}
          <div
            className="login-form-card"
            style={{
              width: '420px',
              backgroundColor: 'var(--color-base-card)',
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              padding: '40px',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Owner Portal</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Use your restaurant username or verified phone number.
                     {/* Login Method Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: 'var(--color-base-bg)', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => { setLoginMethod('username'); setErrors({}); }}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: loginMethod === 'username' ? 'var(--color-base-card)' : 'transparent', color: loginMethod === 'username' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', boxShadow: loginMethod === 'username' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <User size={16} /> Username
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('phone'); setIsOtpSent(false); setErrors({}); }}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: loginMethod === 'phone' ? 'var(--color-base-card)' : 'transparent', color: loginMethod === 'phone' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', boxShadow: loginMethod === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Phone size={16} /> Phone
              </button>
            </div>

            {errors.form && (
              <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '14px', color: '#EF4444', textAlign: 'center', fontWeight: 500 }} className="animate-slide-down">
                {errors.form}
              </div>
            )}

            {loginMethod === 'username' ? (
              /* ═══ USERNAME LOGIN FORM ═══ */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Input
                  id="username"
                  label="Username"
                  placeholder="e.g. thecurrypalace"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={errors.username}
                  required
                />

                <Input
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  required
                />

                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', fontSize: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#F97316', borderRadius: '4px' }} />
                    Remember me
                  </label>
                  <Link
                    to="#"
                    onClick={() => showToast('Password reset is not configured for trial accounts.', 'info')}
                    style={{ fontWeight: 500, color: '#F97316', textDecoration: 'none', marginLeft: 'auto' }}
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-submit-btn"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '12px 16px',
                    lineHeight: '1.5',
                    backgroundColor: '#F97316',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'Signing in…' : 'Access Dashboard'}
                </button>
              </form>
            ) : (
              /* ═══ PHONE LOGIN FORM ═══ */
              <form onSubmit={isOtpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendOtp(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div id="login-recaptcha"></div>
                
                <Input
                  id="phone"
                  label="Mobile Number (+91)"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  disabled={isOtpSent || loading}
                  required
                />

                {isOtpSent && (
                  <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Enter OTP</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      style={{
                        padding: '12px 16px', lineHeight: '1.5', height: '48px',
                        border: `1px solid ${errors.otp ? '#EF4444' : 'var(--color-border)'}`, borderRadius: '8px',
                        textAlign: 'center', fontWeight: 700, fontSize: '16px',
                        letterSpacing: '0.1em', fontFamily: 'inherit',
                        outline: 'none',
                        backgroundColor: 'var(--color-base-bg)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    {errors.otp && (
                      <span style={{ fontSize: '12px', color: '#EF4444' }}>{errors.otp}</span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="login-submit-btn"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '12px 16px',
                    lineHeight: '1.5',
                    backgroundColor: '#F97316',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? (isOtpSent ? 'Verifying…' : 'Sending…') : (isOtpSent ? 'Verify & Login' : 'Send OTP')}
                </button>
                
                {isOtpSent && !loading && (
                  <div style={{ textAlign: 'center', marginTop: '-8px' }}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ background: 'none', border: 'none', color: '#F97316', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Responsive CSS ═══ */}
      <style>{`
        @media (max-width: 767px) {
          .login-left-panel {
            display: none !important;
          }
          .login-right-panel {
            width: 100vw !important;
            height: 100vh !important;
            overflow-y: auto !important;
            padding: 24px !important;
          }
          .login-mobile-logo {
            display: flex !important;
          }
          .login-form-card {
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          .login-submit-btn {
            min-height: 52px !important;
          }
        }
      `}</style>
    </div>
  );
}
