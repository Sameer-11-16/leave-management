import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <div className="auth-card anim-fadeInUp">
          <div className="auth-header">
            <div className="auth-logo">🔐</div>
            <h1 className="auth-title">{step === 1 ? 'Forgot Password?' : 'Verify OTP'}</h1>
            <p className="auth-sub">
              {step === 1 
                ? "Enter your email to receive a password reset code." 
                : "We've sent a 6-digit code to your email."}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="name@company.com" 
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">6-Digit OTP</label>
                <input className="form-input" placeholder="000000" maxLength="6"
                  value={otp} onChange={e => setOtp(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" 
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Reset Password'}
              </button>
              <button type="button" className="btn btn-ghost btn-full" style={{ marginTop: '12px' }} 
                onClick={() => setStep(1)}>
                Change Email
              </button>
            </form>
          )}

          <div className="auth-footer">
            Remembered your password? <Link to="/login" style={{ fontWeight: '600' }}>Back to Login</Link>
          </div>
        </div>
      </div>
      
      <div className="auth-aside">
        <div className="auth-aside-content">
          <h2 className="auth-aside-title">Secure & Simple Password Recovery</h2>
          <p className="auth-aside-text">
            Don't worry, it happens to the best of us. We'll help you get back into your account in just a minute.
          </p>
        </div>
      </div>
    </div>
  );
}
