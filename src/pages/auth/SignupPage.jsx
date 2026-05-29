import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/config';
import {
  completeSignup,
  getAuthErrorMessage,
  isUsernameAvailable,
  normalizeUsername,
  sendVerification,
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtpForSignup,
} from '../../firebase/auth';
import { updateRestaurantProfile } from '../../firebase/firestore';
import { uploadImage } from '../../utils/uploadImage';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import {
  UtensilsCrossed, ArrowRight, ArrowLeft, Upload, Check,
  User, Building, Award, Phone, Sparkles, CheckCircle2, Shield, Zap,
} from 'lucide-react';
import { gsap } from 'gsap';

/* ═══════════════════════════════════════════════════════
   Username Generation Utility
   ═══════════════════════════════════════════════════════ */

/**
 * Generates a unique username from a restaurant name by:
 * 1. Lowercasing and stripping non-alphanumeric characters
 * 2. Checking Firestore login registry for collisions
 * 3. Appending sequential numbers if needed (e.g. thecurrypalace1)
 *
 * @param {string} restaurantName
 * @returns {Promise<string>} unique username
 */
async function generateUniqueUsername(restaurantName) {
  const base = restaurantName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!base) return '';

  if (await isUsernameAvailable(base)) return base;

  // Try sequential suffixes
  let suffix = 1;
  while (suffix <= 100) {
    const candidate = `${base}${suffix}`;
    if (await isUsernameAvailable(candidate)) return candidate;
    suffix++;
  }

  // Fallback: append timestamp fragment
  return `${base}${Date.now().toString(36).slice(-4)}`;
}

/* ═══════════════════════════════════════════════════════
   Step Progress Indicator (inside card)
   ═══════════════════════════════════════════════════════ */

function StepIndicator({ currentStep }) {
  const steps = [
    { icon: User, label: 'Owner' },
    { icon: Building, label: 'Restaurant' },
    { icon: Award, label: 'Done' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', position: 'relative' }}>
      {/* Background track */}
      <div className="bg-[#E8E8E8] dark:bg-[rgba(255,255,255,0.08)]" style={{ position: 'absolute', top: '50%', left: '16px', right: '16px', height: '2px', transform: 'translateY(-50%)', zIndex: 0 }} />
      {/* Progress track */}
      <div style={{
        position: 'absolute', top: '50%', left: '16px', height: '2px',
        backgroundColor: '#F97316', transform: 'translateY(-50%)', zIndex: 0,
        transition: 'width 0.3s ease',
        width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
      }} />

      {steps.map((s, i) => {
        const stepNum = i + 1;
        const isActive = currentStep >= stepNum;
        const isCompleted = currentStep > stepNum;
        const Icon = isCompleted ? Check : s.icon;
        
        return (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
            <div className={isActive ? 'bg-[#F97316] text-[#FFFFFF]' : 'bg-[#F0F0F0] dark:bg-[#1E293B] text-[#AAAAAA] dark:text-[#64748B]'} style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              <Icon style={{ width: '16px', height: '16px' }} />
            </div>
            <span className={`step-label-text ${isActive ? 'text-[#F97316]' : 'text-[#AAAAAA] dark:text-[#64748B]'}`} style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400, marginTop: '6px' }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Signup Page Component
   ═══════════════════════════════════════════════════════ */

function getTenDigitPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return digits;
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1: Owner Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification Sub-state
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [userOtp, setUserOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Step 2: Restaurant Setup
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [gstRate, setGstRate] = useState(5);

  // Auto-generated username state
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Entrance animations and recaptcha setup
  useEffect(() => {
    gsap.fromTo(
      '.signup-card',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
    
    // Initialize recaptcha if on step 1
    if (step === 1) {
      const timer = setTimeout(() => {
        setupRecaptcha('signup-recaptcha');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

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

  // ═══ Auto-generate username when restaurant name changes (Step 2) ═══
  useEffect(() => {
    if (!restaurantName.trim() || restaurantName.trim().length < 3) {
      setGeneratedUsername('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsGeneratingUsername(true);
      try {
        const uname = await generateUniqueUsername(restaurantName);
        setGeneratedUsername(uname);
      } catch (err) {
        console.error('Username generation error:', err);
        setGeneratedUsername('');
      } finally {
        setIsGeneratingUsername(false);
      }
    }, 600); // Debounce 600ms

    return () => clearTimeout(timeoutId);
  }, [restaurantName]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Step 1 Phone & Contact Details Validation
  const validatePhoneFields = () => {
    const tempErrors = {};
    if (!fullName.trim()) tempErrors.fullName = 'Full Name is required.';

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tempErrors.email = 'Enter a valid email address.';
    }

    const cleanPhone = getTenDigitPhone(phone);
    if (!phone.trim()) {
      tempErrors.phone = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      tempErrors.phone = 'Enter a valid 10-digit number or +91 format.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Step 1 Password Validation (Run after phone is verified)
  const validatePasswordFields = () => {
    const tempErrors = {};
    if (!password) {
      tempErrors.password = 'Password is required.';
    } else {
      const hasMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasMinLength) {
        tempErrors.password = 'Password must be at least 8 characters long.';
      } else if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
        tempErrors.password = 'Password must include uppercase, lowercase, number, and special character.';
      }
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const validateStep2 = () => {
    const tempErrors = {};
    if (!restaurantName.trim()) tempErrors.restaurantName = 'Restaurant name is required.';
    if (!address.trim()) tempErrors.address = 'Restaurant address is required.';
    if (!generatedUsername) tempErrors.restaurantName = 'Please enter a valid restaurant name to generate your username.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Real Firebase OTP
  const handleSendOtp = async () => {
    if (!validatePhoneFields()) return;
    
    setLoading(true);
    try {
      const formattedPhone = `+91${getTenDigitPhone(phone)}`;
      
      const confResult = await sendPhoneOtp(formattedPhone);
      setConfirmationResult(confResult);
      setIsOtpSent(true);
      showToast('Verification code sent!', 'info');
    } catch (err) {
      console.error('Send OTP error:', err);
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!userOtp || userOtp.length < 6) {
      setErrors({ otp: 'Please enter a valid 6-digit code.' });
      return;
    }
    
    setLoading(true);
    try {
      await verifyPhoneOtpForSignup(confirmationResult, userOtp);
      setIsPhoneVerified(true);
      showToast('Phone number verified successfully!', 'success');
      setErrors({});
    } catch (err) {
      console.error('Verify OTP error:', err);
      if (err.message === 'PHONE_ALREADY_REGISTERED') {
        showToast('This phone number is already registered. Please login instead.', 'error');
        setErrors({ phone: 'Already registered.' });
        setIsOtpSent(false); // Reset to allow them to change number
      } else {
        showToast(getAuthErrorMessage(err), 'error');
        setErrors({ otp: 'Invalid verification code. Please check and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!isPhoneVerified) {
      showToast('Please verify your phone number using the OTP first.', 'warning');
      return;
    }
    if (!validatePasswordFields()) {
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const formattedPhone = `+91${getTenDigitPhone(phone)}`;

      await completeSignup({
        username: normalizeUsername(generatedUsername),
        fullName,
        restaurantName,
        phone: formattedPhone,
        email: email.trim(),
        password,
      });

      // The user is currently signed in via Phone Auth
      const user = auth.currentUser;
      const uid = user.uid;

      // Handle logo upload
      let logoUrl = '';
      if (logoFile) {
        try {
          logoUrl = await uploadImage(`logos/${uid}/logo_${Date.now()}.jpg`, logoFile);
        } catch (uploadErr) {
          console.error('Logo upload failed:', uploadErr);
          showToast('Account created, but logo upload failed.', 'warning');
        }
      }

      // Update restaurant profile
      await updateRestaurantProfile(uid, {
        address: address.trim(),
        logo: logoUrl,
        gstRate: Number(gstRate),
      });

      // Optional email verification
      if (email.trim()) {
        try {
          await sendVerification();
        } catch (emailErr) {
          console.warn('Failed to send verification email:', emailErr);
        }
      }

      setStep(3);
      showToast('Account registered successfully!', 'success');
    } catch (err) {
      console.error('Signup error:', err);
      const msg = getAuthErrorMessage(err);
      showToast(msg, 'error');
      setErrors({ form: msg });
      if (err.message === 'USERNAME_ALREADY_REGISTERED') {
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    navigate('/onboarding');
  };

  /* ═══ Primary button style (always solid orange, opacity only while loading) ═══ */
  const primaryBtnStyle = (isLoading = false) => ({
    width: '100%',
    height: '48px',
    backgroundColor: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  });

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ═══ Left Panel — Dark Branding (Desktop ≥ 768px) ═══ */}
      <div
        className="signup-left-panel"
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

        <div style={{ maxWidth: '480px', position: 'relative', zIndex: 10, color: '#fff' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ padding: '10px', backgroundColor: '#F97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              <UtensilsCrossed style={{ width: '24px', height: '24px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QRDine
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(249,115,22,0.2)', color: '#F97316', marginBottom: '16px', border: '1px solid rgba(249,115,22,0.3)' }}>
            <Sparkles style={{ width: '12px', height: '12px' }} /> No license required
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Set up your digital menu in minutes.
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '17px', lineHeight: 1.6 }}>
            Create a username, verify your phone, build a menu, and start receiving orders through QR codes from one dashboard.
          </p>
        </div>
      </div>

      {/* ═══ Right Panel — Form ═══ */}
      <div
        className="signup-right-panel bg-[#FFFFFF] dark:bg-[#1E293B]"
        style={{
          width: '50vw',
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div className="signup-card" style={{ opacity: 0 }}>
          {/* Mobile Logo */}
          <div className="signup-mobile-logo" style={{ display: 'none', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <div style={{ padding: '8px', backgroundColor: '#F97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UtensilsCrossed style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#F97316' }}>
              QRDine
            </span>
          </div>

          {/* Form Card */}
          <div id="signup-recaptcha"></div>
          <div
            className="signup-form-card container"
          >
            {/* Step Indicator (inside card) */}
            {step < 3 && <StepIndicator currentStep={step} />}

            {/* ═══ STEP 1: Owner Registration ═══ */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-[#1C1C1C] dark:text-[#F1F5F9]" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Owner Registration</h2>
                  <p className="text-[#696969] dark:text-[#94A3B8]" style={{ fontSize: '14px' }}>
                    Add owner details, verify your phone, and set a password.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {errors.form && (
                    <div style={{ padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '14px', color: '#EF4444', textAlign: 'center', fontWeight: 500 }} className="animate-slide-down">
                      {errors.form}
                    </div>
                  )}

                  <Input
                    id="fullName"
                    label="Full Name"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                    disabled={isPhoneVerified}
                    required
                  />

                  <Input
                    id="email"
                    label="Email Address (Optional)"
                    placeholder="e.g. rahul@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    tooltip="Enter your real email to receive login alerts and verify your account."
                    disabled={isPhoneVerified}
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        id="phone"
                        label="Mobile Number (+91)"
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                        tooltip="Enter your 10-digit mobile number."
                        disabled={isPhoneVerified || isOtpSent || loading}
                        required
                      />
                    </div>
                    {!isPhoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        style={{
                          height: '48px',
                          padding: '0 16px',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: '#F97316',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                          flexShrink: 0,
                          marginTop: '26px',
                          outline: 'none',
                        }}
                      >
                        {isOtpSent ? (loading ? 'Sending…' : 'Resend OTP') : (loading ? 'Sending…' : 'Send OTP')}
                      </button>
                    )}
                  </div>

                  {/* OTP Verification Block */}
                  {isOtpSent && !isPhoneVerified && (
                    <div className="animate-slide-down bg-[#F4F5F7] dark:bg-[#0F172A] border-[#E8E8E8] dark:border-[rgba(255,255,255,0.12)]" style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-[#1C1C1C] dark:text-[#F1F5F9]" style={{ fontSize: '12px', fontWeight: 600 }}>Enter OTP Verification Code</span>
                        {confirmationResult && (
                          <span style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> SMS Sent
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          maxLength="6"
                          placeholder="000000"
                          value={userOtp}
                          onChange={(e) => setUserOtp(e.target.value)}
                          className="bg-[#FFFFFF] dark:bg-[#0F172A] text-[#1C1C1C] dark:text-[#F1F5F9] border-[#E8E8E8] dark:border-[rgba(255,255,255,0.12)] focus:border-[#F97316]"
                          style={{
                            flex: 1, padding: '0 16px', height: '48px',
                            borderWidth: '1px', borderStyle: 'solid', borderRadius: '8px',
                            textAlign: 'center', fontWeight: 700, fontSize: '16px',
                            letterSpacing: '0.1em', fontFamily: 'inherit',
                            outline: 'none',
                            backgroundColor: 'var(--color-base-bg)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={loading}
                          style={{
                            height: '48px', padding: '12px 20px', lineHeight: '1.5',
                            backgroundColor: loading ? '#fed7aa' : '#F97316', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontWeight: 600, fontSize: '14px',
                            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {loading ? 'Verifying…' : 'Verify'}
                        </button>
                      </div>
                      {errors.otp && (
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#EF4444', marginTop: '4px' }}>{errors.otp}</p>
                      )}
                    </div>
                  )}

                  {/* Phone verified badge */}
                  {isPhoneVerified && (
                    <div className="animate-slide-down" style={{ padding: '14px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#16A34A', fontSize: '14px', fontWeight: 600 }}>
                      <div style={{ width: '20px', height: '20px', backgroundColor: '#22C55E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check style={{ width: '14px', height: '14px', color: '#fff' }} />
                      </div>
                      <span>Phone number (+91 {phone.slice(-10)}) successfully verified!</span>
                    </div>
                  )}

                  {isPhoneVerified && (
                    <>
                      <Input
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={errors.password}
                        required
                      />

                      <Input
                        id="confirmPassword"
                        type="password"
                        label="Confirm Password"
                        placeholder="Re-type password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={errors.confirmPassword}
                        required
                      />
                    </>
                  )}

                  <div style={{ paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="signup-continue-btn"
                      style={primaryBtnStyle(false)}
                    >
                      Continue to Restaurant Details
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Restaurant Setup ═══ */}
            {step === 2 && (
              <form onSubmit={handleSignupSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-[#1C1C1C] dark:text-[#F1F5F9]" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Restaurant Profile</h2>
                  <p className="text-[#696969] dark:text-[#94A3B8]" style={{ fontSize: '14px' }}>
                    Tell us about your restaurant. A unique username will be generated for login.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Input
                    id="restaurantName"
                    label="Restaurant Name"
                    placeholder="e.g. The Curry Palace"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    error={errors.restaurantName}
                    required
                  />

                  {/* Auto-generated username display */}
                  {restaurantName.trim().length >= 3 && (
                    <div className="animate-slide-down" style={{
                      padding: '14px 16px',
                      backgroundColor: generatedUsername ? 'var(--color-accent-light)' : 'var(--color-base-bg)',
                      border: `1px solid ${generatedUsername ? '#FDBA74' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text-primary)',
                    }}>
                      {isGeneratingUsername ? (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Generating username…</span>
                      ) : generatedUsername ? (
                        <span>
                          Your login username will be: <strong style={{ color: '#F97316', fontSize: '15px', letterSpacing: '0.01em' }}>{generatedUsername}</strong>
                        </span>
                      ) : (
                        <span style={{ color: '#EF4444' }}>Could not generate username from this name.</span>
                      )}
                    </div>
                  )}

                  <Input
                    id="address"
                    label="Restaurant Address"
                    placeholder="e.g. Shop 4, Connaught Place, New Delhi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    error={errors.address}
                    required
                  />

                  {/* Logo upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Restaurant Logo</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '80px', height: '80px', borderRadius: '8px',
                        backgroundColor: 'var(--color-base-bg)', border: '1px dashed var(--color-border)',
                        display: 'flex', alignItems: 'center', justifycontent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Upload style={{ width: '24px', height: '24px', color: 'var(--color-text-muted)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          htmlFor="logo-upload"
                          className="bg-[#FFFFFF] dark:bg-[#1E293B] text-[#1C1C1C] dark:text-[#F1F5F9] border-[#E8E8E8] dark:border-[rgba(255,255,255,0.12)] hover:border-[#F97316]"
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '0 16px', height: '36px', borderWidth: '1px', borderStyle: 'solid',
                            borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          Select Logo
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoChange}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          PNG or JPG. Compressed automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* GST selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Default GST Rate
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { rate: 5, label: '5% (Standard)' },
                        { rate: 18, label: '18% (AC/Premium)' },
                      ].map(({ rate, label }) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setGstRate(rate)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${gstRate === rate ? '#F97316' : 'var(--color-border)'}`,
                            backgroundColor: gstRate === rate ? 'var(--color-accent-light)' : 'var(--color-base-card)',
                            color: gstRate === rate ? '#F97316' : 'var(--color-text-primary)',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                            outline: gstRate === rate ? '1px solid #F97316' : 'none',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '16px', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={loading}
                      className="bg-[#FFFFFF] dark:bg-[#1E293B] text-[#1C1C1C] dark:text-[#F1F5F9] border-[#E8E8E8] dark:border-[rgba(255,255,255,0.12)] hover:border-[#F97316]"
                      style={{
                        flex: 1, height: '48px',
                        borderWidth: '1px', borderStyle: 'solid', borderRadius: '999px',
                        fontSize: '16px', fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}
                    >
                      <ArrowLeft style={{ width: '16px', height: '16px' }} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="signup-register-btn"
                      style={{ ...primaryBtnStyle(loading), flex: 1 }}
                    >
                      {loading ? 'Registering…' : 'Register Account'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ═══ STEP 3: Success ═══ */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: '64px', height: '64px',
                  backgroundColor: '#DCFCE7', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
                  </svg>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Account Created!</h2>

                {generatedUsername && (
                  <div style={{
                    padding: '16px', margin: '0 auto 24px',
                    backgroundColor: 'var(--color-accent-light)', border: '1px solid var(--color-accent)',
                    borderRadius: '12px', maxWidth: '320px',
                    fontSize: '14px', color: 'var(--color-text-primary)',
                  }}>
                    Your login username is: <br />
                    <strong style={{ fontSize: '18px', color: '#F97316', letterSpacing: '0.01em' }}>{generatedUsername}</strong>
                  </div>
                )}

                {email.trim() ? (
                  <div style={{
                    backgroundColor: 'var(--color-base-bg)', border: '1px solid var(--color-border)',
                    borderRadius: '12px', padding: '16px', textAlign: 'left',
                    maxWidth: '320px', margin: '0 auto 24px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: 'var(--color-text-primary)' }}>
                      <div style={{ padding: '4px', background: 'rgba(249,115,22,0.15)', color: '#F97316', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                        <Award style={{ width: '14px', height: '14px' }} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Verify your email address</span>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>We sent a verification link to <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{email}</span>.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)', maxWidth: '320px', margin: '0 auto 32px', fontSize: '14px' }}>
                    Your restaurant is registered. Let's build your menu and set up tables now.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  style={primaryBtnStyle(false)}
                >
                  Go to Restaurant Setup
                </button>
              </div>
            )}
          </div>

          {/* Sign in link */}
          {step < 3 && (
            <div className="text-[#696969] dark:text-[#94A3B8]" style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Responsive CSS ═══ */}
      <style>{`
        @media (max-width: 767px) {
          .signup-left-panel {
            display: none !important;
          }
          .signup-right-panel {
            width: 100vw !important;
            height: 100vh !important;
            overflow-y: auto !important;
            padding: 24px !important;
            align-items: flex-start !important;
            padding-top: 40px !important;
          }
          .signup-mobile-logo {
            display: flex !important;
          }
          .signup-form-card {
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          .signup-continue-btn,
          .signup-register-btn {
            min-height: 52px !important;
          }
          .step-label-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
