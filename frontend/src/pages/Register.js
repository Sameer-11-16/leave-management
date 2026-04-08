import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Design', 'Sales', 'Legal', 'General'];

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function Register() {
  const [step, setStep] = useState(1); // 1 = form, 2 = otp
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', department: 'Engineering' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  /* ── countdown timer for resend ── */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* ── Step 1: send OTP ── */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await API.post('/auth/send-otp', {
        name: form.name, email: form.email,
        password: form.password, department: form.department,
      });
      toast.success('OTP sent! Check your inbox 📧');
      setStep(2);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP input handling ── */
  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ── Step 2: verify OTP ── */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter the full 6-digit code');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/verify-otp', { email: form.email, otp: code });
      login(data);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await API.post('/auth/resend-otp', { email: form.email });
      toast.success('New OTP sent!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  /* ── password strength ── */
  const getStrength = (p) => {
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: '#f59e0b', width: '40%' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: 'Strong', color: '#10b981', width: '100%' };
    return { label: 'Good', color: '#3b82f6', width: '70%' };
  };
  const strength = getStrength(form.password);

  /* ── shared input icon wrapper ── */
  const iconField = (icon, children) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>{icon}</span>
      {children}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp">

        {/* ── Logo ── */}
        <div className="auth-header">
          <div className="auth-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', background: step >= s ? 'var(--primary)' : 'var(--bg3)', color: step >= s ? '#fff' : 'var(--text3)', transition: 'all 0.3s ease' }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? 'var(--primary)' : 'var(--border)', borderRadius: '2px', transition: 'all 0.3s ease' }} />}
              </div>
            ))}
          </div>

          <h1 className="auth-title">{step === 1 ? 'Create account' : 'Verify your email'}</h1>
          <p className="auth-sub">
            {step === 1 ? 'Join your team on LeaveMS' : `We sent a 6-digit code to ${form.email}`}
          </p>
        </div>

        {/* ══════════ STEP 1 — Registration Form ══════════ */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Full name */}
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" htmlFor="reg-name">Full name</label>
              {iconField(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
                <input id="reg-name" className="form-input" placeholder="John Smith" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required
                  style={{ paddingLeft: '44px' }} />
              )}
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" htmlFor="reg-email">Email address</label>
              {iconField(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
                <input id="reg-email" className="form-input" type="email" placeholder="you@company.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required
                  style={{ paddingLeft: '44px' }} />
              )}
            </div>

            {/* Department */}
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" htmlFor="reg-dept">Department</label>
              {iconField(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
                <select id="reg-dept" className="form-select" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  style={{ paddingLeft: '44px' }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '4px' }}>
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
                <input id="reg-password" className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                  style={{ paddingLeft: '44px', paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}>
                  <EyeIcon open={showPass} />
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '4px', transition: 'all 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strength.color, fontWeight: '600', marginTop: '3px', display: 'block' }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <input id="reg-confirm" className="form-input" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                  style={{
                    paddingLeft: '44px', paddingRight: '44px',
                    borderColor: form.confirmPassword && (form.password !== form.confirmPassword ? '#ef4444' : '#10b981')
                  }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}
                  aria-label={showConfirm ? 'Hide' : 'Show'}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'block' }}>Passwords don't match</span>
              )}
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ position: 'relative' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                  Sending OTP...
                </span>
              ) : '📧 Send Verification Code'}
            </button>
          </form>
        )}

        {/* ══════════ STEP 2 — OTP Verification ══════════ */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* OTP boxes */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '12px 0 20px' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (otpRefs.current[idx] = el)}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  style={{
                    width: '46px', height: '54px', textAlign: 'center', fontSize: '22px', fontWeight: '700',
                    border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '12px', background: 'var(--bg2)', color: 'var(--text)',
                    outline: 'none', transition: 'border-color 0.2s',
                    caretColor: 'var(--primary)',
                  }}
                  aria-label={`OTP digit ${idx + 1}`}
                />
              ))}
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading || otp.join('').length < 6}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                  Verifying...
                </span>
              ) : '✅ Verify & Create Account'}
            </button>

            {/* Resend + Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <button type="button" onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                ← Change email
              </button>
              <button type="button" onClick={handleResend} disabled={countdown > 0 || loading}
                style={{ background: 'none', border: 'none', fontSize: '13px', cursor: countdown > 0 ? 'not-allowed' : 'pointer', color: countdown > 0 ? 'var(--text3)' : 'var(--primary)', fontWeight: '600', padding: 0 }}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer" style={{ marginTop: '20px' }}>
          Have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}